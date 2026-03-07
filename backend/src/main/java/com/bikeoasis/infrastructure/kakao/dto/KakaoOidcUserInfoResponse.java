package com.bikeoasis.infrastructure.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 카카오 OIDC 사용자 Info 응답을 전달하는 DTO다.
 */
public record KakaoOidcUserInfoResponse(
        @JsonProperty("sub") String sub,
        @JsonProperty("nickname") String nickname,
        @JsonProperty("name") String name,
        @JsonProperty("preferred_username") String preferredUsername
) {
}
