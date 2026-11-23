package com.entertainhub.controller;

import com.entertainhub.common.ApiException;
import com.entertainhub.service.AuthService;
import com.entertainhub.service.SupabaseService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final SupabaseService supabase;
    private final AuthService auth;

    public UserController(SupabaseService supabase, AuthService auth) {
        this.supabase = supabase;
        this.auth = auth;
    }

    @GetMapping({"", "/"})
    public Map<String, Object> getUsers(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        auth.requireAdmin(authorization);
        if (page < 1 || limit < 1 || limit > 100) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid pagination");
        }
        List<String> filters = new ArrayList<>();
        filters.add("role=eq.customer");
        if (search != null) filters.add("full_name=ilike.*" + search + "*");
        if (isActive != null) filters.add("is_active=eq." + isActive);
        int start = (page - 1) * limit;
        SupabaseService.TableResult result = supabase.tableGetResult("profiles", "*", filters,
                "created_at.desc", start, start + limit - 1);
        return Map.of("total", result.total(), "page", page, "limit", limit,
                "users", supabase.mapper().convertValue(result.data(), List.class));
    }

    @PatchMapping("/me")
    public Map<String, Object> updateMyProfile(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> payload) {
        Map<String, Object> current = auth.getCurrentUser(authorization);
        if (payload.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No changes provided");
        }
        if (payload.containsKey("full_name") && payload.get("full_name") == null) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Full name cannot be null");
        }
        JsonNode data = supabase.tableUpdate("profiles", payload,
                List.of("id=eq." + current.get("id")));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Profile not found");
        }
        return Map.of("message", "Profile updated successfully",
                "user", supabase.mapper().convertValue(data.get(0), Map.class));
    }

    @GetMapping("/{userId}")
    public Map<String, Object> getUser(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID userId) {
        auth.requireAdmin(authorization);
        JsonNode data = supabase.tableGet("profiles", "*",
                List.of("id=eq." + userId, "role=eq.customer"),
                null, 0, 0, false);
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Customer not found");
        }
        return supabase.mapper().convertValue(data.get(0), Map.class);
    }

    @PatchMapping("/{userId}/status")
    public Map<String, Object> updateUserStatus(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID userId,
            @RequestBody Map<String, Object> payload) {
        auth.requireAdmin(authorization);
        if (!payload.containsKey("is_active")) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "is_active is required");
        }
        JsonNode data = supabase.tableUpdate("profiles",
                Map.of("is_active", payload.get("is_active")),
                List.of("id=eq." + userId, "role=eq.customer"));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Customer not found");
        }
        boolean active = Boolean.TRUE.equals(payload.get("is_active"));
        return Map.of("message", active
                        ? "Customer activated successfully"
                        : "Customer deactivated successfully",
                "user", supabase.mapper().convertValue(data.get(0), Map.class));
    }
}
