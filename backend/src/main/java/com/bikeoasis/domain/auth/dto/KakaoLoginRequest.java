package com.bikeoasis.domain.auth.dto;

/**
 * 카카오 Login 요청을 전달하는 DTO다.
 */
public record KakaoLoginRequest(
        String code,
        String codeVerifier,
        String redirectUri,
        String nonce
) {
}
