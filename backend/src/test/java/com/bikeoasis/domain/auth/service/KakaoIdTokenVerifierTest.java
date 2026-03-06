package com.bikeoasis.domain.auth.service;

import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.infrastructure.kakao.KakaoJwkClient;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Date;
import java.util.List;

import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class KakaoIdTokenVerifierTest {

    @Mock
    private KakaoJwkClient kakaoJwkClient;

    private KakaoIdTokenVerifier verifier;

    @BeforeEach
    void setUp() {
        verifier = new KakaoIdTokenVerifier(kakaoJwkClient);
        ReflectionTestUtils.setField(verifier, "issuer", "https://kauth.kakao.com");
        ReflectionTestUtils.setField(verifier, "clientId", "client-id");
    }

    @Test
    void verify_acceptsValidRs256Token() throws Exception {
        RSAKey rsaKey = new RSAKey.Builder(TestKeys.publicKey())
                .privateKey(TestKeys.privateKey())
                .keyUse(KeyUse.SIGNATURE)
                .algorithm(JWSAlgorithm.RS256)
                .keyID("kid-1")
                .build();

        when(kakaoJwkClient.getCurrentJwkSet()).thenReturn(new JWKSet(rsaKey.toPublicJWK()));

        String idToken = signedToken(rsaKey, "client-id", "nonce-1", Instant.now().plusSeconds(300));

        Jwt jwt = verifier.verify(idToken);

        Assertions.assertThat(jwt.getSubject()).isEqualTo("kakao-sub");
        Assertions.assertThat(jwt.getClaimAsString("nickname")).isEqualTo("카카오닉네임");
    }

    @Test
    void verify_rejectsWhenAudienceMismatched() throws Exception {
        RSAKey rsaKey = new RSAKey.Builder(TestKeys.publicKey())
                .privateKey(TestKeys.privateKey())
                .keyUse(KeyUse.SIGNATURE)
                .algorithm(JWSAlgorithm.RS256)
                .keyID("kid-1")
                .build();

        when(kakaoJwkClient.getCurrentJwkSet()).thenReturn(new JWKSet(rsaKey.toPublicJWK()));

        String idToken = signedToken(rsaKey, "wrong-client", "nonce-1", Instant.now().plusSeconds(300));

        BusinessException ex = Assertions.catchThrowableOfType(() -> verifier.verify(idToken), BusinessException.class);

        Assertions.assertThat(ex.getCode()).isEqualTo(401);
        Assertions.assertThat(ex.getMessage()).contains("aud");
    }

    private String signedToken(RSAKey rsaKey, String audience, String nonce, Instant expiresAt) throws JOSEException {
        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256)
                        .keyID(rsaKey.getKeyID())
                        .build(),
                new JWTClaimsSet.Builder()
                        .issuer("https://kauth.kakao.com")
                        .subject("kakao-sub")
                        .audience(List.of(audience))
                        .expirationTime(Date.from(expiresAt))
                        .issueTime(Date.from(Instant.now()))
                        .claim("nonce", nonce)
                        .claim("nickname", "카카오닉네임")
                        .build()
        );
        jwt.sign(new RSASSASigner(rsaKey.toPrivateKey()));
        return jwt.serialize();
    }

    private static final class TestKeys {
        private static final java.security.KeyPair KEY_PAIR = generateKeyPair();

        private static java.security.interfaces.RSAPublicKey publicKey() throws Exception {
            return (java.security.interfaces.RSAPublicKey) KEY_PAIR.getPublic();
        }

        private static java.security.interfaces.RSAPrivateKey privateKey() throws Exception {
            return (java.security.interfaces.RSAPrivateKey) KEY_PAIR.getPrivate();
        }

        private static java.security.KeyPair generateKeyPair() {
            try {
            java.security.KeyPairGenerator generator = java.security.KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
            } catch (Exception e) {
                throw new IllegalStateException("RSA test key generation failed", e);
            }
        }
    }
}
