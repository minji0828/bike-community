package com.bikeoasis.domain.user.controller;

import com.bikeoasis.domain.user.dto.LocationResponse;
import com.bikeoasis.domain.user.dto.LocationUpdateRequest;
import com.bikeoasis.domain.user.service.LocationService;
import com.bikeoasis.global.admin.AdminKeyAuthService;
import com.bikeoasis.global.auth.AuthenticatedUserResolver;
import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 사용자 위치 API 엔드포인트
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/locations")
@RequiredArgsConstructor
@Tag(name = "위치 API", description = "사용자 위치 조회/업데이트")
public class LocationController {
    private final LocationService locationService;
    private final AdminKeyAuthService adminKeyAuthService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping("/{userId}/current")
    @Operation(summary = "현재 위치 조회", description = "사용자의 가장 최근 위치를 조회합니다.")
    public ResponseEntity<ApiResponse<LocationResponse>> getCurrentLocation(
            @PathVariable Long userId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long requesterUserId = authenticatedUserResolver.requireUserId(jwt);
        requireSameUser(requesterUserId, userId);
        log.info("사용자 {} 현재 위치 조회 요청", userId);
        LocationResponse location = locationService.getCurrentLocation(userId);
        return ResponseEntity.ok(ApiResponse.success(location));
    }

    @PostMapping("/{userId}")
    @Operation(summary = "위치 업데이트", description = "사용자의 현재 위치를 업데이트합니다.")
    public ResponseEntity<ApiResponse<LocationResponse>> updateLocation(
            @PathVariable Long userId,
            @RequestBody LocationUpdateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long requesterUserId = authenticatedUserResolver.requireUserId(jwt);
        requireSameUser(requesterUserId, userId);
        log.info("사용자 {} 위치 업데이트 요청", userId);
        LocationResponse location = locationService.updateLocation(userId, request);
        return ResponseEntity.ok(ApiResponse.success(location));
    }

    @GetMapping("/{userId}/history")
    @Operation(summary = "위치 이력 조회", description = "사용자의 위치 이력을 페이지네이션으로 조회합니다.")
    public ResponseEntity<ApiResponse<Page<LocationResponse>>> getLocationHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long requesterUserId = authenticatedUserResolver.requireUserId(jwt);
        requireSameUser(requesterUserId, userId);
        log.info("사용자 {} 위치 이력 조회: page={}, size={}", userId, page, size);
        Page<LocationResponse> locations = locationService.getLocationHistory(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(locations));
    }

    @GetMapping("/{userId}/period")
    @Operation(summary = "기간별 위치 이력 조회", description = "특정 기간의 위치 이력을 조회합니다.")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getLocationsByPeriod(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long requesterUserId = authenticatedUserResolver.requireUserId(jwt);
        requireSameUser(requesterUserId, userId);
        log.info("사용자 {} 기간별 위치 이력 조회: {} ~ {}", userId, startTime, endTime);
        List<LocationResponse> locations = locationService.getLocationsByPeriod(userId, startTime, endTime);
        return ResponseEntity.ok(ApiResponse.success(locations));
    }

    @GetMapping("/{userId}/recent")
    @Operation(summary = "최근 N개 위치 조회", description = "사용자의 최근 N개 위치를 조회합니다. (경로 추적용)")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getLastNLocations(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "50") int limit,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long requesterUserId = authenticatedUserResolver.requireUserId(jwt);
        requireSameUser(requesterUserId, userId);
        log.info("사용자 {} 최근 {} 개 위치 조회", userId, limit);
        List<LocationResponse> locations = locationService.getLastNLocations(userId, limit);
        return ResponseEntity.ok(ApiResponse.success(locations));
    }

    @GetMapping("/nearby")
    @Operation(summary = "특정 반경 내 사용자 위치 조회", description = "특정 좌표 반경 내의 모든 사용자 위치를 조회합니다. (관리자용)")
    public ResponseEntity<ApiResponse<List<LocationResponse>>> getLocationsWithinRadius(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam(defaultValue = "1000") double radius,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        log.info("관리자 반경 조회: lat={}, lon={}, radius={}", latitude, longitude, radius);
        List<LocationResponse> locations = locationService.getLocationsWithinRadius(latitude, longitude, radius);
        return ResponseEntity.ok(ApiResponse.success(locations));
    }

    @GetMapping("/{userId}/distance")
    @Operation(summary = "이동 거리 계산", description = "최근 N개 위치로부터 사용자의 총 이동 거리를 계산합니다.")
    public ResponseEntity<ApiResponse<Map<String, Object>>> calculateTravelDistance(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "50") int limit,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long requesterUserId = authenticatedUserResolver.requireUserId(jwt);
        requireSameUser(requesterUserId, userId);
        log.info("사용자 {} 이동 거리 계산", userId);
        double distance = locationService.calculateTravelDistance(userId, limit);
        Map<String, Object> result = new HashMap<>();
        result.put("user_id", userId);
        result.put("distance_meters", distance);
        result.put("distance_kilometers", distance / 1000.0);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @DeleteMapping("/{userId}/old-history")
    @Operation(summary = "오래된 위치 이력 삭제", description = "지정된 기간 이전의 위치 이력을 삭제합니다. (GDPR 대응)")
    public ResponseEntity<ApiResponse<String>> deleteOldLocationHistory(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "30") int daysToKeep,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long requesterUserId = authenticatedUserResolver.requireUserId(jwt);
        requireSameUser(requesterUserId, userId);
        log.info("사용자 {} 오래된 위치 이력 삭제 ({}일 이전)", userId, daysToKeep);
        locationService.deleteOldLocationHistory(userId, daysToKeep);
        return ResponseEntity.ok(ApiResponse.success("오래된 위치 이력이 삭제되었습니다"));
    }

    private void requireSameUser(Long requesterUserId, Long targetUserId) {
        if (!requesterUserId.equals(targetUserId)) {
            throw new BusinessException(403, "본인 위치 정보에만 접근할 수 있습니다.");
        }
    }
}

