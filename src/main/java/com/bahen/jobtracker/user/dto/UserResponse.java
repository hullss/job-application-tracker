package com.bahen.jobtracker.user.dto;

import java.time.Instant;

public record UserResponse(
        Long id,
        String email,
        Instant createdAt
) {
}