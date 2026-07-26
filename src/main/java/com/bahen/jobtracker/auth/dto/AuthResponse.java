package com.bahen.jobtracker.auth.dto;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn
) {
}