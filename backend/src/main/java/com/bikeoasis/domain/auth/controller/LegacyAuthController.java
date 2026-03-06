package com.bikeoasis.domain.auth.controller;

import com.bikeoasis.domain.auth.dto.AuthMeResponse;
import com.bikeoasis.domain.auth.service.AuthService;
import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class LegacyAuthController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthMeResponse>> me(@AuthenticationPrincipal Jwt jwt) {
        AuthMeResponse response = authService.getCurrentUser(requireUserId(jwt));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private Long requireUserId(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new BusinessException(401, "인증이 필요합니다.");
        }

        try {
            return Long.parseLong(jwt.getSubject());
        } catch (NumberFormatException e) {
            throw new BusinessException(401, "유효하지 않은 인증 토큰입니다.");
        }
    }
}
