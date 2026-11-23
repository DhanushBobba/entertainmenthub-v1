package com.entertainhub.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthRequests {
    public record LoginRequest(
            @Email @NotBlank String email,
            @Size(min = 6) String password) {}

    public record RegisterRequest(
            @JsonProperty("full_name") @Size(min = 2, max = 100) String fullName,
            @Email @NotBlank String email,
            @Size(min = 8) String password) {}

    public record RefreshRequest(
            @JsonProperty("refresh_token") @NotBlank String refreshToken) {}

    public record LogoutRequest(
            @JsonProperty("refresh_token") @NotBlank String refreshToken) {}
}
