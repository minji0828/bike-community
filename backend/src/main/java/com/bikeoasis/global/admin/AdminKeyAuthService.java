package com.bikeoasis.global.admin;

import com.bikeoasis.global.error.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 관리 Key 인증 관련 관리자 보조 기능을 담당한다.
 */
@Component
public class AdminKeyAuthService {

    @Value("${admin.api.key:}")
    private String adminApiKey;

    public void requireAdmin(String providedKey) {
        if (adminApiKey == null || adminApiKey.isBlank()) {
            throw new BusinessException(404, "Not found");
        }
        if (providedKey == null || providedKey.isBlank()) {
            throw new BusinessException(401, "관리자 키가 필요합니다.");
        }
        if (!adminApiKey.equals(providedKey)) {
            throw new BusinessException(403, "관리자 권한이 없습니다.");
        }
    }
}
