package com.bikeoasis.domain.auth.service;

import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoIdTokenVerifier {

    @Qualifier("kakaoIdTokenDecoder")
    private final JwtDecoder kakaoIdTokenDecoder;

    public Jwt verify(String idToken) {
        try {
            return kakaoIdTokenDecoder.decode(idToken);
        } catch (Exception e) {
            log.warn("Kakao id_token verification failed: {}", e.getMessage());
            throw new BusinessException(401, "유효하지 않은 Kakao id_token입니다.");
        }
    }
}
