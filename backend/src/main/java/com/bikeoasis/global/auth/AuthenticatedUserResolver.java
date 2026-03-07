package com.bikeoasis.global.auth;

import com.bikeoasis.global.error.BusinessException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
public class AuthenticatedUserResolver {

    /**
     * HTTP 컨트롤러에서 선택적 인증이 필요한 경우 사용한다.
     * 토큰이 없거나 subject가 비정상이면 null을 반환한다.
     */
    public Long getUserId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }
        return parseOptional(jwt.getSubject());
    }

    /**
     * HTTP 컨트롤러에서 인증이 필수인 경우 사용한다.
     * 유효하지 않은 subject는 401 비즈니스 예외로 변환한다.
     */
    public Long requireUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new BusinessException(401, "인증이 필요합니다.");
        }
        return parseRequired(jwt.getSubject(), "유효하지 않은 인증 토큰입니다.");
    }

    /**
     * WebSocket/STOMP Principal에서 선택적으로 사용자 ID를 꺼낸다.
     */
    public Long getUserId(Principal principal) {
        if (principal == null) {
            return null;
        }
        return parseOptional(principal.getName());
    }

    /**
     * WebSocket/STOMP Principal에서 사용자 ID를 강제 추출한다.
     */
    public Long requireUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new BusinessException(401, "인증이 필요합니다.");
        }
        return parseRequired(principal.getName(), "유효하지 않은 사용자 인증입니다.");
    }

    private Long parseOptional(String rawUserId) {
        if (rawUserId == null || rawUserId.isBlank()) {
            return null;
        }

        try {
            return Long.parseLong(rawUserId);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long parseRequired(String rawUserId, String invalidMessage) {
        try {
            return Long.parseLong(rawUserId);
        } catch (NumberFormatException e) {
            throw new BusinessException(401, invalidMessage);
        }
    }
}
