package com.bikeoasis.domain.auth.dto;

/**
 * 인증 토큰 응답을 전달하는 DTO다.
 */
public record AuthTokenResponse(
        String accessToken,
        long expiresInSec
) {
}
