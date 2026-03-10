package com.bikeoasis.domain.riding.controller;

import com.bikeoasis.domain.riding.dto.RidingCreateRequest;
import com.bikeoasis.domain.riding.dto.RidingCreateResponse;
import com.bikeoasis.domain.riding.service.RidingService;
import com.bikeoasis.global.auth.AuthenticatedUserResolver;
import com.bikeoasis.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 라이딩 관련 API 엔드포인트를 담당하는 컨트롤러다.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ridings")
@RequiredArgsConstructor
public class RidingController {

    private final RidingService ridingService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @PostMapping
    public ResponseEntity<ApiResponse<RidingCreateResponse>> createRiding(@RequestBody RidingCreateRequest request,
                                                                          @AuthenticationPrincipal Jwt jwt) {
        Long requesterUserId = authenticatedUserResolver.requireUserId(jwt);
        Long ridingId = ridingService.saveRiding(request, requesterUserId);
        return ResponseEntity.ok(ApiResponse.success(new RidingCreateResponse(ridingId)));
    }
}
