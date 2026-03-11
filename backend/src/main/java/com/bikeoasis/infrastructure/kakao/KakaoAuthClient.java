package com.bikeoasis.infrastructure.kakao;

import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.infrastructure.kakao.dto.KakaoTokenResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * 카카오 인증 관련 카카오 외부 연동을 담당하는 클래스다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoAuthClient {

    private final RestTemplate restTemplate;

    @Value("${kakao.oauth.client-id:}")
    private String clientId;

    @Value("${kakao.oauth.client-secret:}")
    private String clientSecret;

    @Value("${kakao.oauth.token-uri:https://kauth.kakao.com/oauth/token}")
    private String tokenUri;

    public KakaoTokenResponse exchangeCodeForToken(String code, String codeVerifier, String redirectUri) {
        if (clientId == null || clientId.isBlank()) {
            throw new BusinessException(500, "서버 Kakao client-id 설정이 필요합니다.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", clientId);
        form.add("redirect_uri", redirectUri);
        form.add("code", code);
        form.add("code_verifier", codeVerifier);
        if (clientSecret != null && !clientSecret.isBlank()) {
            form.add("client_secret", clientSecret);
        }

        try {
            ResponseEntity<KakaoTokenResponse> response = restTemplate.exchange(
                    tokenUri,
                    HttpMethod.POST,
                    new HttpEntity<>(form, headers),
                    KakaoTokenResponse.class
            );
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new BusinessException(401, "Kakao 토큰 교환에 실패했습니다.");
            }
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            log.error(
                    "Kakao token exchange failed: status={}, redirectUri={}, response={}",
                    e.getStatusCode(),
                    redirectUri,
                    e.getResponseBodyAsString()
            );
            throw new BusinessException(401, "Kakao 토큰 교환에 실패했습니다. Redirect URI, OpenID Connect, Client Secret 설정을 확인하세요.");
        } catch (RestClientException e) {
            log.error("Kakao token exchange failed: redirectUri={}", redirectUri, e);
            throw new BusinessException(401, "Kakao 토큰 교환에 실패했습니다. 네트워크 또는 Kakao 인증 설정을 확인하세요.");
        }
    }
}
