package com.bikeoasis.domain.auth.controller;

import com.bikeoasis.domain.auth.dto.AuthMeResponse;
import com.bikeoasis.domain.auth.service.AuthService;
import com.bikeoasis.global.auth.AuthenticatedUserResolver;
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
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthMeResponse>> me(@AuthenticationPrincipal Jwt jwt) {
        AuthMeResponse response = authService.getCurrentUser(authenticatedUserResolver.requireUserId(jwt));
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
