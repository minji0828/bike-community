package com.bikeoasis.global.config;

import com.bikeoasis.global.error.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.web.client.RestOperations;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Configuration
public class JwtConfig {

    @Bean
    public JwtEncoder jwtEncoder(@Value("${app.jwt.secret:}") String secret) {
        SecretKey key = hmacKey(secret);
        OctetSequenceKey jwk = new OctetSequenceKey.Builder(key)
                .keyID("app")
                .build();
        JWKSet jwkSet = new JWKSet(jwk);
        return new NimbusJwtEncoder(new ImmutableJWKSet<SecurityContext>(jwkSet));
    }

    @Bean
    @Primary
    public JwtDecoder jwtDecoder(@Value("${app.jwt.secret:}") String secret,
                                @Value("${app.jwt.issuer:bikeoasis}") String issuer,
                                @Value("${app.jwt.audience:}") String audience) {
        SecretKey key = hmacKey(secret);
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();

        OAuth2TokenValidator<Jwt> issuerValidator = new JwtIssuerValidator(issuer);
        OAuth2TokenValidator<Jwt> timestampValidator = new JwtTimestampValidator(Duration.ofSeconds(60));
        OAuth2TokenValidator<Jwt> audienceValidator = jwt -> {
            if (audience == null || audience.isBlank()) {
                return OAuth2TokenValidatorResult.success();
            }
            Object aud = jwt.getClaims().get("aud");
            if (aud instanceof String audStr && audience.equals(audStr)) {
                return OAuth2TokenValidatorResult.success();
            }
            if (aud instanceof java.util.Collection<?> audList && audList.contains(audience)) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "audience가 일치하지 않습니다.", null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuerValidator, timestampValidator, audienceValidator));
        return decoder;
    }

    @Bean
    public JwtDecoder kakaoIdTokenDecoder(
            @Value("${kakao.oauth.jwk-set-uri:https://kauth.kakao.com/.well-known/jwks.json}") String jwkSetUri,
            @Value("${kakao.oauth.issuer:https://kauth.kakao.com}") String issuer,
            @Value("${kakao.oauth.client-id:}") String clientId,
            RestTemplateBuilder restTemplateBuilder
    ) {
        RestOperations restOperations = restTemplateBuilder
                .connectTimeout(Duration.ofSeconds(5))
                .readTimeout(Duration.ofSeconds(10))
                .build();

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri)
                .restOperations(restOperations)
                .build();
        OAuth2TokenValidator<Jwt> issuerValidator = new JwtIssuerValidator(issuer);
        OAuth2TokenValidator<Jwt> timestampValidator = new JwtTimestampValidator(Duration.ofSeconds(60));
        OAuth2TokenValidator<Jwt> kakaoSpecificValidator = jwt -> {
            if (clientId == null || clientId.isBlank()) {
                return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Kakao client-id 설정이 필요합니다.", null));
            }

            Object alg = jwt.getHeaders().get("alg");
            if (alg != null && !"RS256".equals(String.valueOf(alg))) {
                return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "지원하지 않는 Kakao id_token alg입니다.", null));
            }

            Object aud = jwt.getClaims().get("aud");
            if (aud instanceof String audStr && clientId.equals(audStr)) {
                return OAuth2TokenValidatorResult.success();
            }
            if (aud instanceof java.util.Collection<?> audList && audList.contains(clientId)) {
                if (audList.size() > 1) {
                    String azp = jwt.getClaimAsString("azp");
                    if (azp == null || azp.isBlank() || !clientId.equals(azp)) {
                        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Kakao id_token azp가 일치하지 않습니다.", null));
                    }
                }
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Kakao id_token aud가 일치하지 않습니다.", null));
        };
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuerValidator, timestampValidator, kakaoSpecificValidator));
        return decoder;
    }

    private SecretKey hmacKey(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new BusinessException(500, "APP_JWT_SECRET 설정이 필요합니다.");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new BusinessException(500, "APP_JWT_SECRET는 최소 32바이트 이상이어야 합니다.");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }
}
