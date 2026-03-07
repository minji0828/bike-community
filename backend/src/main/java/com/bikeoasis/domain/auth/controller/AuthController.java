package com.bikeoasis.domain.auth.controller;

import com.bikeoasis.domain.auth.dto.AuthTokenResponse;
import com.bikeoasis.domain.auth.dto.AuthMeResponse;
import com.bikeoasis.domain.auth.dto.KakaoLoginRequest;
import com.bikeoasis.domain.auth.service.AuthService;
import com.bikeoasis.global.auth.AuthenticatedUserResolver;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth API", description = "카카오 소셜 로그인")
public class AuthController {

    private final AuthService authService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @PostMapping("/kakao")
    @Operation(summary = "카카오 로그인", description = "authorization code(PKCE)를 교환해 서비스 access token(JWT)을 발급합니다.")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> kakaoLogin(@RequestBody KakaoLoginRequest request) {
        AuthTokenResponse response = authService.loginWithKakao(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "현재 로그인 사용자 조회", description = "서비스 access token(JWT) 기준 현재 로그인 사용자 정보를 반환합니다.")
    public ResponseEntity<ApiResponse<AuthMeResponse>> me(@AuthenticationPrincipal Jwt jwt) {
        AuthMeResponse response = authService.getCurrentUser(authenticatedUserResolver.requireUserId(jwt));
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
