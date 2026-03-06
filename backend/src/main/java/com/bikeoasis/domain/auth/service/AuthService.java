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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final KakaoAuthClient kakaoAuthClient;
    private final KakaoIdTokenVerifier kakaoIdTokenVerifier;
    private final KakaoOidcUserInfoClient kakaoOidcUserInfoClient;
    private final AppTokenService appTokenService;
    private final UserRepository userRepository;

    @Value("${kakao.oauth.client-id:}")
    private String kakaoClientId;

    @Value("${kakao.oauth.allowed-redirect-uris:}")
    private String allowedRedirectUris;

    @Value("${app.jwt.access-token-exp-seconds:3600}")
    private long accessTokenExpSeconds;

    @Transactional
    public AuthTokenResponse loginWithKakao(KakaoLoginRequest request) {
        if (request == null || request.code() == null || request.code().isBlank()) {
            throw new BusinessException(400, "code는 필수입니다.");
        }
        if (request.codeVerifier() == null || request.codeVerifier().isBlank()) {
            throw new BusinessException(400, "codeVerifier는 필수입니다.");
        }
        if (request.redirectUri() == null || request.redirectUri().isBlank()) {
            throw new BusinessException(400, "redirectUri는 필수입니다.");
        }
        validateRedirectUri(request.redirectUri());
        if (kakaoClientId == null || kakaoClientId.isBlank()) {
            throw new BusinessException(500, "서버 Kakao client-id 설정이 필요합니다.");
        }

        KakaoTokenResponse tokenResponse = kakaoAuthClient.exchangeCodeForToken(
                request.code(),
                request.codeVerifier(),
                request.redirectUri()
        );

        if (tokenResponse.idToken() == null || tokenResponse.idToken().isBlank()) {
            throw new BusinessException(400, "Kakao id_token이 없습니다. OIDC(openid scope) 설정을 확인하세요.");
        }

        String kakaoSub;
        try {
            Jwt idToken = kakaoIdTokenVerifier.verify(tokenResponse.idToken());

            if (request.nonce() != null && !request.nonce().isBlank()) {
                String nonce = idToken.getClaimAsString("nonce");
                if (nonce == null || nonce.isBlank() || !request.nonce().equals(nonce)) {
                    throw new BusinessException(401, "Kakao nonce가 일치하지 않습니다.");
                }
            }

            kakaoSub = idToken.getSubject();
            if (kakaoSub == null || kakaoSub.isBlank()) {
                throw new BusinessException(400, "Kakao sub(subject)가 없습니다.");
            }
        } catch (BusinessException e) {
            if (!"유효하지 않은 Kakao id_token입니다.".equals(e.getMessage())) {
                throw e;
            }

            log.warn("Falling back to Kakao OIDC userinfo because id_token verification failed.");
            kakaoSub = kakaoOidcUserInfoClient.fetchSub(tokenResponse.accessToken());
        }

        final String resolvedKakaoSub = kakaoSub;

        User user = userRepository.findByProviderAndProviderSub(AuthProvider.KAKAO, resolvedKakaoSub)
                .orElseGet(() -> {
                    try {
                        return userRepository.save(User.builder()
                                .provider(AuthProvider.KAKAO)
                                .providerSub(resolvedKakaoSub)
                                .username("익명")
                                .build());
                    } catch (DataIntegrityViolationException e) {
                        return userRepository.findByProviderAndProviderSub(AuthProvider.KAKAO, resolvedKakaoSub)
                                .orElseThrow(() -> new BusinessException(500, "사용자 생성에 실패했습니다."));
                    }
                });

        String accessToken = appTokenService.issueAccessToken(user.getId(), accessTokenExpSeconds);
        return new AuthTokenResponse(accessToken, accessTokenExpSeconds);
    }

    private void validateRedirectUri(String redirectUri) {
        if (allowedRedirectUris == null || allowedRedirectUris.isBlank()) {
            return;
        }
        List<String> allowed = Arrays.stream(allowedRedirectUris.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
        if (allowed.isEmpty()) {
            return;
        }
        if (!allowed.contains(redirectUri)) {
            throw new BusinessException(400, "허용되지 않은 redirectUri입니다.");
        }
    }
}
