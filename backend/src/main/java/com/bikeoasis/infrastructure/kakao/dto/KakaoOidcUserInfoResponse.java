package com.bikeoasis.infrastructure.kakao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record KakaoOidcUserInfoResponse(
        @JsonProperty("sub") String sub
) {
}
