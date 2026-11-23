package com.entertainhub.controller;

import com.entertainhub.common.ApiException;
import com.entertainhub.service.AuthService;
import com.entertainhub.service.SupabaseService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/movies")
public class MovieController {
    private final SupabaseService supabase;
    private final AuthService auth;

    public MovieController(SupabaseService supabase, AuthService auth) {
        this.supabase = supabase;
        this.auth = auth;
    }

    @GetMapping({"", "/"})
    public Map<String, Object> getMovies(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(required = false) String search,
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
            filters.add("status=in.(upcoming,now_showing)");
        }
        if (search != null) filters.add("title=ilike.*" + search + "*");
        if (status != null) filters.add("status=eq." + status);
        if (categoryId != null) filters.add("category_id=eq." + categoryId);
        int start = (page - 1) * limit;
        SupabaseService.TableResult result = supabase.tableGetResult("movies",
                "*,categories(id,name)", filters, "created_at.desc",
                start, start + limit - 1);
        return Map.of("total", result.total(), "page", page, "limit", limit,
                "movies", supabase.mapper().convertValue(result.data(), List.class));
    }

    @GetMapping("/{movieId}")
    public Map<String, Object> getMovie(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID movieId) {
        Map<String, Object> user = auth.getCurrentUser(authorization);
        List<String> filters = new ArrayList<>(List.of("id=eq." + movieId));
        if (!"admin".equals(user.get("role"))) {
            filters.add("status=in.(upcoming,now_showing)");
        }
        JsonNode data = supabase.tableGet("movies", "*,categories(id,name)",
                filters, null, 0, 0, false);
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Movie not found");
        }
        return supabase.mapper().convertValue(data.get(0), Map.class);
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createMovie(
            @RequestHeader("Authorization") String authorization,
            @RequestBody Map<String, Object> payload) {
        auth.requireAdmin(authorization);
        validateCategory(payload.get("category_id"));
        validateRequiredCreate(payload);
        JsonNode data = supabase.tableInsert("movies", payload);
        return Map.of("message", "Movie created successfully",
                "movie", supabase.mapper().convertValue(data.get(0), Map.class));
    }

    @PutMapping("/{movieId}")
    public Map<String, Object> updateMovie(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID movieId,
            @RequestBody Map<String, Object> payload) {
        auth.requireAdmin(authorization);
        if (payload.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "No changes provided");
        }
        for (String field : List.of("title", "ticket_price", "status")) {
            if (payload.containsKey(field) && payload.get(field) == null) {
                throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Required movie fields cannot be null");
            }
        }
        if (payload.containsKey("category_id")) validateCategory(payload.get("category_id"));
        JsonNode data = supabase.tableUpdate("movies", payload, List.of("id=eq." + movieId));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Movie not found");
        }
        return Map.of("message", "Movie updated successfully",
                "movie", supabase.mapper().convertValue(data.get(0), Map.class));
    }

    @DeleteMapping("/{movieId}")
    public Map<String, Object> deleteMovie(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID movieId) {
        auth.requireAdmin(authorization);
        JsonNode data = supabase.tableUpdate("movies", Map.of("status", "inactive"),
                List.of("id=eq." + movieId));
        if (data == null || data.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Movie not found");
        }
        return Map.of("message", "Movie deactivated successfully");
    }

    private void validateRequiredCreate(Map<String, Object> payload) {
        Object title = payload.get("title");
        if (!(title instanceof String) || ((String) title).length() < 1 || ((String) title).length() > 200) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid title");
        }
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
