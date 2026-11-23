package com.entertainhub.controller;

import com.entertainhub.common.ApiException;
import com.entertainhub.service.AuthService;
import com.entertainhub.service.SupabaseService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final SupabaseService supabase;
    private final AuthService auth;

    public EventController(SupabaseService supabase, AuthService auth) {
        this.supabase = supabase;
        this.auth = auth;
    }

    @GetMapping({"", "/"})
    public Map<String, Object> getEvents(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        Map<String, Object> user = auth.getCurrentUser(authorization);
        if (page < 1 || limit < 1 || limit > 100) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid pagination");
        }
        List<String> filters = new ArrayList<>();
        if (!"admin".equals(user.get("role"))) {
            filters.add("status=in.(upcoming,ongoing)");
        }
        if (search != null) filters.add("title=ilike.*" + search + "*");
        if (city != null) filters.add("city=ilike." + city);
        if (status != null) filters.add("status=eq." + status);
        if (categoryId != null) filters.add("category_id=eq." + categoryId);
        int start = (page - 1) * limit;
        SupabaseService.TableResult result = supabase.tableGetResult("events",
                "*,categories(id,name)", filters, "event_date.asc,event_time.asc",
                start, start + limit - 1);
        return Map.of("total", result.total(), "page", page, "limit", limit,
                "events", supabase.mapper().convertValue(result.data(), List.class));
    }

    @GetMapping("/{eventId}")
    public Map<String, Object> getEvent(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID eventId) {
        Map<String, Object> user = auth.getCurrentUser(authorization);
        List<String> filters = new ArrayList<>(List.of("id=eq." + eventId));
        if (!"admin".equals(user.get("role"))) {
            filters.add("status=in.(upcoming,ongoing)");
        }
        JsonNode data = supabase.tableGet("events", "*,categories(id,name)",
                filters, null, 0, 0, false);
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Event not found");
        }
        return supabase.mapper().convertValue(data.get(0), Map.class);
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createEvent(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> payload) {
        auth.requireAdmin(authorization);
        validateCategory(payload.get("category_id"));
        if (!payload.containsKey("title") || !payload.containsKey("venue") ||
            !payload.containsKey("city") || !payload.containsKey("event_date") ||
            !payload.containsKey("event_time") || !payload.containsKey("total_seats")) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Required event fields are missing");
        }
        JsonNode data = supabase.tableInsert("events", payload);
        return Map.of("message", "Event created successfully",
                "event", supabase.mapper().convertValue(data.get(0), Map.class));
    }

    @PutMapping("/{eventId}")
    public Map<String, Object> updateEvent(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID eventId,
            @RequestBody Map<String, Object> payload) {
        auth.requireAdmin(authorization);
        if (payload.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No changes provided");
        }
        for (String field : List.of("title", "venue", "city", "event_date", "event_time",
                "ticket_price", "total_seats", "status")) {
            if (payload.containsKey(field) && payload.get(field) == null) {
                throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, field + " cannot be null");
            }
        }
        if (payload.containsKey("category_id")) validateCategory(payload.get("category_id"));
        JsonNode data = supabase.tableUpdate("events", payload, List.of("id=eq." + eventId));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Event not found");
        }
        return Map.of("message", "Event updated successfully",
                "event", supabase.mapper().convertValue(data.get(0), Map.class));
    }

    @DeleteMapping("/{eventId}")
    public Map<String, Object> cancelEvent(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID eventId) {
        auth.requireAdmin(authorization);
        JsonNode data = supabase.tableUpdate("events", Map.of("status", "cancelled"),
                List.of("id=eq." + eventId));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Event not found");
        }
        return Map.of("message", "Event cancelled successfully");
    }

    private void validateCategory(Object categoryId) {
        if (categoryId == null) return;
        JsonNode data = supabase.tableGet("categories", "id",
                List.of("id=eq." + categoryId, "is_active=eq.true"),
                null, 0, 0, false);
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or inactive category");
        }
    }
}
