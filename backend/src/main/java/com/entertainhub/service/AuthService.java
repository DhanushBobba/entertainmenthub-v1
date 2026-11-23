package com.entertainhub.service;

import com.entertainhub.common.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {
    private final SupabaseService supabase;

    public AuthService(SupabaseService supabase) {
        this.supabase = supabase;
    }

    private String accessToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return authorization.substring("Bearer ".length()).trim();
    }

    public Map<String, Object> getCurrentUser(String authorization) {
        String token = accessToken(authorization);
        JsonNode authUser;
        try {
            authUser = supabase.verifyUser(token);
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired access token");
        }
        if (authUser == null || !authUser.has("id")) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired access token");
        }
        return getProfile(authUser.path("id").asText());
    }

    public Map<String, Object> getProfile(String userId) {
        JsonNode result = supabase.tableGet(
                "profiles", "*",
                java.util.List.of("id=eq." + userId),
                null, 0, 0, false);

        if (result == null || !result.isArray() || result.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User profile not found");
        }
        Map<String, Object> profile = supabase.objectMap(result.get(0));
        if (!Boolean.TRUE.equals(profile.get("is_active"))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is inactive");
        }
        return profile;
    }

    public Map<String, Object> requireAdmin(String authorization) {
        Map<String, Object> user = getCurrentUser(authorization);
        if (!"admin".equals(user.get("role"))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrator access required");
        }
        return user;
    }

    public Map<String, Object> requireCustomer(String authorization) {
        Map<String, Object> user = getCurrentUser(authorization);
        if (!"customer".equals(user.get("role"))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Customer access required");
        }
        return user;
    }
}
