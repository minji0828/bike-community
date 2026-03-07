package com.bikeoasis.domain.auth.dto;

/**
 * 인증 Me 응답을 전달하는 DTO다.
 */
public record AuthMeResponse(
        Long userId,
        String username,
        String provider
) {
}
