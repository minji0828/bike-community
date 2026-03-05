package com.bikeoasis.domain.auth.dto;

public record AuthTokenResponse(
        String accessToken,
        long expiresInSec
) {
}
