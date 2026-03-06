package com.bikeoasis.infrastructure.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record KakaoOidcUserInfoResponse(
        @JsonProperty("sub") String sub,
        @JsonProperty("nickname") String nickname,
        @JsonProperty("name") String name,
        @JsonProperty("preferred_username") String preferredUsername
) {
}
