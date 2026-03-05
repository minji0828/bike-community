package com.bikeoasis.domain.auth.dto;

public record KakaoLoginRequest(
        String code,
        String codeVerifier,
        String redirectUri,
        String nonce
) {
}
