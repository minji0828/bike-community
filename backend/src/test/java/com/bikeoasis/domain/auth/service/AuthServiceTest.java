package com.bikeoasis.domain.auth.service;

import com.bikeoasis.domain.auth.dto.AuthTokenResponse;
import com.bikeoasis.domain.auth.dto.KakaoLoginRequest;
import com.bikeoasis.domain.user.entity.User;
import com.bikeoasis.domain.user.enums.AuthProvider;
import com.bikeoasis.domain.user.repository.UserRepository;
import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.infrastructure.kakao.KakaoAuthClient;
import com.bikeoasis.infrastructure.kakao.KakaoOidcUserInfoClient;
import com.bikeoasis.infrastructure.kakao.dto.KakaoTokenResponse;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private KakaoAuthClient kakaoAuthClient;

    @Mock
    private KakaoIdTokenVerifier kakaoIdTokenVerifier;

    @Mock
    private KakaoOidcUserInfoClient kakaoOidcUserInfoClient;

    @Mock
    private AppTokenService appTokenService;

    @Mock
    private UserRepository userRepository;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(kakaoAuthClient, kakaoIdTokenVerifier, kakaoOidcUserInfoClient, appTokenService, userRepository);
        ReflectionTestUtils.setField(authService, "kakaoClientId", "client-id");
        ReflectionTestUtils.setField(authService, "allowedRedirectUris", "http://localhost:3000/auth/kakao/callback");
        ReflectionTestUtils.setField(authService, "accessTokenExpSeconds", 600L);
    }

    @Test
    void loginWithKakao_throws400WhenCodeMissing() {
        BusinessException ex = Assertions.catchThrowableOfType(
                () -> authService.loginWithKakao(new KakaoLoginRequest("", "verifier", "http://localhost:3000/auth/kakao/callback", null)),
                BusinessException.class
        );
        Assertions.assertThat(ex.getCode()).isEqualTo(400);
        Assertions.assertThat(ex.getMessage()).contains("code");
    }

    @Test
    void loginWithKakao_throws400WhenRedirectUriNotAllowed() {
        BusinessException ex = Assertions.catchThrowableOfType(
                () -> authService.loginWithKakao(new KakaoLoginRequest("code", "verifier", "http://evil.example/cb", null)),
                BusinessException.class
        );
        Assertions.assertThat(ex.getCode()).isEqualTo(400);
        Assertions.assertThat(ex.getMessage()).contains("redirectUri");
    }

    @Test
    void loginWithKakao_throws401WhenNonceMismatch() {
        KakaoTokenResponse tokenResponse = new KakaoTokenResponse(
                "kakao-access",
                "bearer",
                null,
                3600L,
                "openid",
                "id-token",
                null
        );
        when(kakaoAuthClient.exchangeCodeForToken(eq("code"), eq("verifier"), eq("http://localhost:3000/auth/kakao/callback")))
                .thenReturn(tokenResponse);

        Jwt jwt = new Jwt(
                "id-token",
                Instant.now(),
                Instant.now().plusSeconds(60),
                Map.of("alg", "none"),
                Map.of("sub", "kakao-sub", "nonce", "nonce-from-token")
        );
        when(kakaoIdTokenVerifier.verify("id-token")).thenReturn(jwt);

        BusinessException ex = Assertions.catchThrowableOfType(
                () -> authService.loginWithKakao(new KakaoLoginRequest("code", "verifier", "http://localhost:3000/auth/kakao/callback", "nonce-from-request")),
                BusinessException.class
        );
        Assertions.assertThat(ex.getCode()).isEqualTo(401);
        Assertions.assertThat(ex.getMessage()).contains("nonce");
    }

    @Test
    void loginWithKakao_issuesAppJwt() {
        KakaoTokenResponse tokenResponse = new KakaoTokenResponse(
                "kakao-access",
                "bearer",
                null,
                3600L,
                "openid",
                "id-token",
                null
        );
        when(kakaoAuthClient.exchangeCodeForToken(eq("code"), eq("verifier"), eq("http://localhost:3000/auth/kakao/callback")))
                .thenReturn(tokenResponse);

        Jwt jwt = new Jwt(
                "id-token",
                Instant.now(),
                Instant.now().plusSeconds(60),
                Map.of("alg", "none"),
                Map.of("sub", "kakao-sub", "nonce", "nonce-1")
        );
        when(kakaoIdTokenVerifier.verify("id-token")).thenReturn(jwt);

        when(userRepository.findByProviderAndProviderSub(AuthProvider.KAKAO, "kakao-sub"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(7L);
            return user;
        });

        when(appTokenService.issueAccessToken(eq(7L), anyLong())).thenReturn("app-jwt");

        AuthTokenResponse response = authService.loginWithKakao(
                new KakaoLoginRequest("code", "verifier", "http://localhost:3000/auth/kakao/callback", "nonce-1")
        );

        Assertions.assertThat(response.accessToken()).isEqualTo("app-jwt");
        Assertions.assertThat(response.expiresInSec()).isEqualTo(600L);
    }

    @Test
    void loginWithKakao_fallsBackToUserInfoWhenIdTokenVerificationFails() {
        KakaoTokenResponse tokenResponse = new KakaoTokenResponse(
                "kakao-access",
                "bearer",
                null,
                3600L,
                "openid",
                "id-token",
                null
        );
        when(kakaoAuthClient.exchangeCodeForToken(eq("code"), eq("verifier"), eq("http://localhost:3000/auth/kakao/callback")))
                .thenReturn(tokenResponse);

        when(kakaoIdTokenVerifier.verify("id-token"))
                .thenThrow(new BusinessException(401, "유효하지 않은 Kakao id_token입니다."));
        when(kakaoOidcUserInfoClient.fetchSub("kakao-access")).thenReturn("kakao-sub");

        when(userRepository.findByProviderAndProviderSub(AuthProvider.KAKAO, "kakao-sub"))
                .thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(9L);
            return user;
        });

        when(appTokenService.issueAccessToken(eq(9L), anyLong())).thenReturn("app-jwt-fallback");

        AuthTokenResponse response = authService.loginWithKakao(
                new KakaoLoginRequest("code", "verifier", "http://localhost:3000/auth/kakao/callback", "nonce-1")
        );

        Assertions.assertThat(response.accessToken()).isEqualTo("app-jwt-fallback");
        Assertions.assertThat(response.expiresInSec()).isEqualTo(600L);
    }
}
