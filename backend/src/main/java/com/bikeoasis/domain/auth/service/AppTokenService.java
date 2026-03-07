package com.bikeoasis.domain.auth.service;

import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * 애플리케이션 토큰 관련 비즈니스 로직을 담당하는 서비스다.
 */
@Component
@RequiredArgsConstructor
public class AppTokenService {

    private final JwtEncoder jwtEncoder;

    @Value("${app.jwt.issuer:bikeoasis}")
    private String issuer;

    @Value("${app.jwt.audience:}")
    private String audience;

    public String issueAccessToken(Long userId, String username, long expiresInSec) {
        if (userId == null) {
            throw new BusinessException(500, "userId가 필요합니다.");
        }
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(Math.max(60, expiresInSec));

        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(exp)
                .subject(String.valueOf(userId))
                .claim("uid", userId)
                .claim("username", username)
                ;

        if (audience != null && !audience.isBlank()) {
            claimsBuilder.audience(List.of(audience));
        }

        JwtClaimsSet claims = claimsBuilder.build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
