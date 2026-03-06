package com.bikeoasis.domain.auth.dto;

public record AuthMeResponse(
        Long userId,
        String username,
        String provider
) {
}
