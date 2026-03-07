package com.bikeoasis.domain.auth.service;

import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.infrastructure.kakao.KakaoJwkClient;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * 카카오 Id 토큰 Verifier 관련 비즈니스 로직을 담당하는 서비스다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoIdTokenVerifier {

    private final KakaoJwkClient kakaoJwkClient;

    @Value("${kakao.oauth.issuer:https://kauth.kakao.com}")
    private String issuer;

    @Value("${kakao.oauth.client-id:}")
    private String clientId;

    public Jwt verify(String idToken) {
        try {
            SignedJWT signedJwt = SignedJWT.parse(idToken);
            JWSHeader header = signedJwt.getHeader();

            validateHeader(header);
            verifySignature(signedJwt, header);

            JWTClaimsSet claims = signedJwt.getJWTClaimsSet();
            validateClaims(claims);

            Instant issuedAt = toInstant(claims.getIssueTime());
            Instant expiresAt = toInstant(claims.getExpirationTime());

            return new Jwt(
                    idToken,
                    issuedAt != null ? issuedAt : Instant.now(),
                    expiresAt != null ? expiresAt : Instant.now().plusSeconds(60),
                    header.toJSONObject(),
                    claims.getClaims()
            );
        } catch (BusinessException e) {
            log.warn("Kakao id_token verification failed: {}", e.getMessage());
            throw e;
        } catch (ParseException e) {
            log.warn("Kakao id_token parse failed", e);
            throw new BusinessException(401, "유효하지 않은 Kakao id_token입니다.");
        } catch (JOSEException e) {
            log.warn("Kakao id_token signature verification failed", e);
            throw new BusinessException(401, "유효하지 않은 Kakao id_token입니다.");
        }
    }

    private void validateHeader(JWSHeader header) {
        if (header == null) {
            throw new BusinessException(401, "Kakao id_token 헤더가 없습니다.");
        }
        if (!JWSAlgorithm.RS256.equals(header.getAlgorithm())) {
            throw new BusinessException(401, "Kakao id_token alg가 RS256이 아닙니다.");
        }
        if (header.getKeyID() == null || header.getKeyID().isBlank()) {
            throw new BusinessException(401, "Kakao id_token kid가 없습니다.");
        }
    }

    private void verifySignature(SignedJWT signedJwt, JWSHeader header) throws JOSEException {
        RSAKey rsaKey = resolveRsaKey(header.getKeyID(), true);
        if (!signedJwt.verify(new RSASSAVerifier(rsaKey.toRSAPublicKey()))) {
            throw new BusinessException(401, "Kakao id_token 서명 검증에 실패했습니다.");
        }
    }

    private RSAKey resolveRsaKey(String kid, boolean allowRefresh) {
        JWKSet jwkSet = allowRefresh ? kakaoJwkClient.getCurrentJwkSet() : kakaoJwkClient.refresh();
        RSAKey rsaKey = jwkSet.getKeys().stream()
                .filter(jwk -> isMatchingKey(jwk, kid))
                .findFirst()
                .map(jwk -> (RSAKey) jwk)
                .orElse(null);

        if (rsaKey != null) {
            return rsaKey;
        }
        if (allowRefresh) {
            return resolveRsaKey(kid, false);
        }
        throw new BusinessException(401, "Kakao id_token kid에 해당하는 공개키가 없습니다.");
    }

    private boolean isMatchingKey(JWK jwk, String kid) {
        return jwk instanceof RSAKey
                && kid.equals(jwk.getKeyID())
                && (jwk.getKeyUse() == null || KeyUse.SIGNATURE.equals(jwk.getKeyUse()))
                && (jwk.getAlgorithm() == null || JWSAlgorithm.RS256.equals(jwk.getAlgorithm()));
    }

    private void validateClaims(JWTClaimsSet claims) {
        if (claims == null) {
            throw new BusinessException(401, "Kakao id_token payload가 없습니다.");
        }
        if (issuer == null || issuer.isBlank()) {
            throw new BusinessException(500, "Kakao issuer 설정이 필요합니다.");
        }
        if (clientId == null || clientId.isBlank()) {
            throw new BusinessException(500, "Kakao client-id 설정이 필요합니다.");
        }
        if (!issuer.equals(claims.getIssuer())) {
            throw new BusinessException(401, "Kakao id_token iss가 일치하지 않습니다.");
        }

        List<String> audience = claims.getAudience();
        if (audience == null || !audience.contains(clientId)) {
            throw new BusinessException(401, "Kakao id_token aud가 일치하지 않습니다.");
        }

        Instant now = Instant.now();
        Instant expiresAt = toInstant(claims.getExpirationTime());
        if (expiresAt == null || expiresAt.isBefore(now.minusSeconds(60))) {
            throw new BusinessException(401, "Kakao id_token이 만료되었습니다.");
        }

        Instant issuedAt = toInstant(claims.getIssueTime());
        if (issuedAt != null && issuedAt.isAfter(now.plus(Duration.ofMinutes(5)))) {
            throw new BusinessException(401, "Kakao id_token iat가 유효하지 않습니다.");
        }

        if (claims.getSubject() == null || claims.getSubject().isBlank()) {
            throw new BusinessException(401, "Kakao id_token sub가 없습니다.");
        }
    }

    private Instant toInstant(Date value) {
        return value == null ? null : value.toInstant();
    }
}
