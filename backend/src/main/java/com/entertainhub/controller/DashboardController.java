package com.entertainhub.controller;

import com.entertainhub.service.AuthService;
import com.entertainhub.service.SupabaseService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final SupabaseService supabase;
    private final AuthService auth;

    public DashboardController(SupabaseService supabase, AuthService auth) {
        this.supabase = supabase;
        this.auth = auth;
    }

    @GetMapping("/statistics")
    public Map<String, Object> statistics(@RequestHeader("Authorization") String authorization) {
        auth.requireAdmin(authorization);
        JsonNode result = supabase.rpc("get_dashboard_statistics", Map.of());
        return Map.of("success", true, "statistics", supabase.mapper().convertValue(result, Object.class));
    }

    @GetMapping("/recent-bookings")
    public Map<String, Object> recentBookings(@RequestHeader("Authorization") String authorization) {
        auth.requireAdmin(authorization);
        JsonNode data = supabase.tableGet("bookings",
                "*,profiles(id,full_name,email),movies(id,title,poster_url),events(id,title,banner_url)",
                List.of(), "created_at.desc", 0, 9, false);
        return Map.of("total", data.size(), "bookings",
                supabase.mapper().convertValue(data, List.class));
    }

    @GetMapping("/upcoming-events")
    public Map<String, Object> upcomingEvents(@RequestHeader("Authorization") String authorization) {
        auth.requireAdmin(authorization);
        JsonNode data = supabase.tableGet("events", "*",
                List.of("status=eq.upcoming"), "event_date.asc,event_time.asc", 0, 4, false);
        return Map.of("total", data.size(), "events",
                supabase.mapper().convertValue(data, List.class));
    }
}
