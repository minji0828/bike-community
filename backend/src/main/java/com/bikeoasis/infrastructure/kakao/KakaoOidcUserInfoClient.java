package com.bikeoasis.infrastructure.kakao;

import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.infrastructure.kakao.dto.KakaoOidcUserInfoResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * 카카오 OIDC 사용자 Info 관련 카카오 외부 연동을 담당하는 클래스다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoOidcUserInfoClient {

    private final RestTemplate restTemplate;

    @Value("${kakao.oauth.userinfo-uri:https://kapi.kakao.com/v1/oidc/userinfo}")
    private String userInfoUri;

    public KakaoOidcUserInfoResponse fetchUserInfo(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new BusinessException(401, "Kakao access token이 없습니다.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        try {
            ResponseEntity<KakaoOidcUserInfoResponse> response = restTemplate.exchange(
                    userInfoUri,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    KakaoOidcUserInfoResponse.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null || response.getBody().sub() == null || response.getBody().sub().isBlank()) {
                throw new BusinessException(401, "Kakao 사용자 정보를 확인하지 못했습니다.");
            }

            return response.getBody();
        } catch (RestClientException e) {
            log.error("Kakao userinfo fetch failed", e);
            throw new BusinessException(401, "Kakao 사용자 정보를 확인하지 못했습니다.");
        }
    }

    public String fetchSub(String accessToken) {
        return fetchUserInfo(accessToken).sub();
    }
}
