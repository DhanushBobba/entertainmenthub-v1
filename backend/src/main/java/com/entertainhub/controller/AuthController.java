package com.entertainhub.controller;

import com.entertainhub.common.ApiException;
import com.entertainhub.config.AppProperties;
import com.entertainhub.dto.AuthRequests;
import com.entertainhub.service.AuthService;
import com.entertainhub.service.SupabaseService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping
public class AuthController {
    private final SupabaseService supabase;
    private final AuthService authService;
    private final AppProperties properties;

    public AuthController(SupabaseService supabase, AuthService authService, AppProperties properties) {
        this.supabase = supabase;
        this.authService = authService;
        this.properties = properties;
    }

    @GetMapping({"", "/", "/api", "/api/"})
    public Map<String, Object> root() {
        return Map.of("message", "Welcome to EntertainHub API", "version", "1.0.0");
    }

    @GetMapping({"/health", "/api/health"})
    public Map<String, Object> health() {
        return Map.of("status", "healthy", "service", properties.appName());
    }

    @PostMapping({"/api/auth/register", "/auth/register"})
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody AuthRequests.RegisterRequest payload) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("email", payload.email());
            body.put("password", payload.password());
            body.put("options", Map.of("data", Map.of("full_name", payload.fullName())));
            JsonNode response = supabase.authPost("signup", body);
            boolean emailConfirmationRequired = !response.has("session") ||
                    response.get("session").isNull();
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Registration submitted. Check email if confirmation is required.",
                    "email_confirmation_required", emailConfirmationRequired));
        } catch (HttpStatusCodeException exception) {
            throw new ApiException(
                    HttpStatus.valueOf(exception.getStatusCode().value()),
                    supabaseErrorDetail(exception.getResponseBodyAsString()));
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Registration failed");
        }
    }

    @PostMapping({"/api/auth/login", "/auth/login"})
    public Map<String, Object> login(@Valid @RequestBody AuthRequests.LoginRequest payload) {
        try {
            Map<String, Object> body = Map.of(
                    "email", payload.email(),
                    "password", payload.password());
            JsonNode response = supabase.authPost("token?grant_type=password", body);
            if (!response.has("user") || !response.has("access_token")) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Login failed");
            }
            String userId = response.path("user").path("id").asText();
            Map<String, Object> profile = authService.getProfile(userId);
            return sessionResponse(response, profile);
        } catch (ApiException exception) {
            throw exception;
        } catch (HttpStatusCodeException exception) {
            throw new ApiException(
                    HttpStatus.valueOf(exception.getStatusCode().value()),
                    supabaseErrorDetail(exception.getResponseBodyAsString()));
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
    }

    @GetMapping({"/api/auth/me", "/auth/me"})
    public Map<String, Object> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
        return authService.getCurrentUser(authorization);
    }

    @PostMapping({"/api/auth/refresh", "/auth/refresh"})
    public Map<String, Object> refresh(@Valid @RequestBody AuthRequests.RefreshRequest payload) {
        try {
            JsonNode response = supabase.authPost("token?grant_type=refresh_token",
                    Map.of("refresh_token", payload.refreshToken()));
            if (!response.has("session") && !response.has("access_token")) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Session refresh failed");
            }
            String userId = response.path("user").path("id").asText();
            if (userId.isBlank()) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Session refresh failed");
            }
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("access_token", response.path("access_token").asText());
            result.put("refresh_token", response.path("refresh_token").asText());
            result.put("token_type", "bearer");
            result.put("expires_in", response.path("expires_in").asInt());
            result.put("user", authService.getProfile(userId));
            return result;
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }
    }

    @PostMapping({"/api/auth/logout", "/auth/logout"})
    public Map<String, Object> logout(
            @Valid @RequestBody AuthRequests.LogoutRequest payload,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        Map<String, Object> current = authService.getCurrentUser(authorization);
        String accessToken = authorization.substring("Bearer ".length()).trim();
        try {
            supabase.authPostWithAccessToken("logout", accessToken,
                    Map.of("refresh_token", payload.refreshToken()));
            return Map.of("message", "Logout successful");
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Logout failed");
        }
    }

    private Map<String, Object> sessionResponse(JsonNode response, Map<String, Object> profile) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("message", "Login successful");
        result.put("access_token", response.path("access_token").asText());
        result.put("refresh_token", response.path("refresh_token").asText());
        result.put("token_type", "bearer");
        result.put("expires_in", response.path("expires_in").asInt());
        result.put("user", profile);
        return result;
    }

    private String supabaseErrorDetail(String body) {
        try {
            JsonNode error = new com.fasterxml.jackson.databind.ObjectMapper().readTree(body);
            if (error.has("msg")) return error.path("msg").asText();
            if (error.has("message")) return error.path("message").asText();
            if (error.has("error_description")) return error.path("error_description").asText();
            if (error.has("detail")) return error.path("detail").asText();
        } catch (Exception ignored) {
        }
        return "Registration failed";
    }
}
