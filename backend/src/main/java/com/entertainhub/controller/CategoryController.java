package com.entertainhub.controller;

import com.entertainhub.common.ApiException;
import com.entertainhub.service.AuthService;
import com.entertainhub.service.SupabaseService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final SupabaseService supabase;
    private final AuthService auth;

    public CategoryController(SupabaseService supabase, AuthService auth) {
        this.supabase = supabase;
        this.auth = auth;
    }

    @GetMapping({"", "/"})
    public Map<String, Object> getCategories(@RequestHeader("Authorization") String authorization) {
        Map<String, Object> user = auth.getCurrentUser(authorization);
        List<String> filters = "admin".equals(user.get("role"))
                ? List.of()
                : List.of("is_active=eq.true");
        JsonNode data = supabase.tableGet("categories", "*", filters, "name.asc", null, null, false);
        List<Object> categories = supabase.mapper().convertValue(data, List.class);
        return Map.of("total", categories.size(), "categories", categories);
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createCategory(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> payload) {
        auth.requireAdmin(authorization);
        String name = Objects.toString(payload.get("name"), "");
        if (name.length() < 2 || name.length() > 100) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Category name must be between 2 and 100 characters");
        }
        try {
            JsonNode data = supabase.tableInsert("categories", payload);
            if (data == null || data.isEmpty()) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to create category");
            }
            return Map.of("message", "Category created successfully", "category", supabase.mapper().convertValue(data.get(0), Map.class));
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.CONFLICT, "Category already exists");
        }
    }

    @PutMapping("/{categoryId}")
    public Map<String, Object> updateCategory(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID categoryId,
            @RequestBody Map<String, Object> payload) {
        auth.requireAdmin(authorization);
        if (payload.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No changes provided");
        }
        if (payload.containsKey("name") && payload.get("name") == null ||
            payload.containsKey("is_active") && payload.get("is_active") == null) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Name and active status cannot be null");
        }
        try {
            JsonNode data = supabase.tableUpdate("categories", payload,
                    List.of("id=eq." + categoryId));
            if (data == null || data.isEmpty()) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Category not found");
            }
            return Map.of("message", "Category updated successfully", "category", supabase.mapper().convertValue(data.get(0), Map.class));
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.CONFLICT, "Category already exists");
        }
    }

    @DeleteMapping("/{categoryId}")
    public Map<String, Object> deactivateCategory(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID categoryId) {
        auth.requireAdmin(authorization);
        JsonNode data = supabase.tableUpdate("categories", Map.of("is_active", false),
                List.of("id=eq." + categoryId));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Category not found");
        }
        return Map.of("message", "Category deactivated successfully");
    }
}
