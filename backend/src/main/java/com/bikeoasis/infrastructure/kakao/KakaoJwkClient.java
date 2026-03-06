package com.bikeoasis.infrastructure.kakao;

import com.bikeoasis.global.error.BusinessException;
import com.nimbusds.jose.jwk.JWKSet;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoJwkClient {

    private final RestTemplate restTemplate;

    @Value("${kakao.oauth.jwk-set-uri:https://kauth.kakao.com/.well-known/jwks.json}")
    private String jwkSetUri;

    private volatile CachedJwkSet cachedJwkSet;

    public JWKSet getCurrentJwkSet() {
        CachedJwkSet current = cachedJwkSet;
        if (current != null && !current.isExpired()) {
            return current.jwkSet();
        }
        return refresh();
    }

    public JWKSet refresh() {
        synchronized (this) {
            CachedJwkSet current = cachedJwkSet;
            if (current != null && !current.isExpired()) {
                return current.jwkSet();
            }

            try {
                String response = restTemplate.getForObject(jwkSetUri, String.class);
                if (response == null || response.isBlank()) {
                    throw new BusinessException(502, "Kakao JWK 세트를 가져오지 못했습니다.");
                }

                JWKSet jwkSet = JWKSet.parse(response);
                cachedJwkSet = new CachedJwkSet(jwkSet, Instant.now().plus(Duration.ofMinutes(10)));
                return jwkSet;
            } catch (RestClientException | ParseException e) {
                log.error("Failed to fetch Kakao JWK set", e);
                throw new BusinessException(502, "Kakao 공개키를 가져오지 못했습니다.");
            }
        }
    }

    private record CachedJwkSet(JWKSet jwkSet, Instant expiresAt) {
        private boolean isExpired() {
            return expiresAt == null || Instant.now().isAfter(expiresAt);
        }
    }
}
