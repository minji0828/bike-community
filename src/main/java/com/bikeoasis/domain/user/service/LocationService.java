package com.bikeoasis.domain.user.service;

import com.bikeoasis.domain.user.dto.LocationResponse;
import com.bikeoasis.domain.user.dto.LocationUpdateRequest;
import com.bikeoasis.domain.user.entity.User;
import com.bikeoasis.domain.user.entity.UserLocation;
import com.bikeoasis.domain.user.repository.UserLocationRepository;
import com.bikeoasis.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 사용자 위치 관련 비즈니스 로직
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationService {
    private final UserLocationRepository userLocationRepository;
    private final UserRepository userRepository;
    private final GeometryFactory geometryFactory;

    /**
     * 사용자의 현재 위치 조회
     */
    public LocationResponse getCurrentLocation(Long userId) {
        log.info("사용자 {} 현재 위치 조회", userId);

        UserLocation location = userLocationRepository.findLatestLocationByUserId(userId)
                .orElseThrow(() -> new RuntimeException("위치 정보가 없습니다. userId: " + userId));

        return LocationResponse.from(location);
    }

    /**
     * 사용자 위치 업데이트
     */
    @Transactional
    public LocationResponse updateLocation(Long userId, LocationUpdateRequest request) {
        log.info("사용자 {} 위치 업데이트: lat={}, lon={}", userId, request.getLatitude(), request.getLongitude());

        // 데이터 유효성 검사
        if (!request.isValid()) {
            throw new IllegalArgumentException("유효하지 않은 위경도입니다");
        }

        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. userId: " + userId));

        // 기존 현재 위치를 과거로 표시
        userLocationRepository.findByUserIdAndIsCurrentTrue(userId)
                .ifPresent(current -> {
                    current.setIsCurrent(false);
                    userLocationRepository.save(current);
                });

        // 새로운 위치 저장
        Point location = geometryFactory.createPoint(
                new Coordinate(request.getLongitude(), request.getLatitude())
        );

        UserLocation userLocation = UserLocation.builder()
                .user(user)
                .location(location)
                .accuracy(request.getAccuracy())
                .speed(request.getSpeed())
                .altitude(request.getAltitude())
                .metadata(request.getMetadata() != null ? request.getMetadata() : new HashMap<>())
                .isCurrent(true)
                .build();

        UserLocation saved = userLocationRepository.save(userLocation);
        log.info("위치 업데이트 완료: locationId={}", saved.getId());

        return LocationResponse.from(saved);
    }

    /**
     * 사용자 위치 이력 조회 (페이지네이션)
     */
    public Page<LocationResponse> getLocationHistory(Long userId, int page, int size) {
        log.info("사용자 {} 위치 이력 조회: page={}, size={}", userId, page, size);

        Pageable pageable = PageRequest.of(page, size);
        Page<UserLocation> locations = userLocationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        return locations.map(LocationResponse::from);
    }

    /**
     * 특정 기간의 위치 이력 조회
     */
    public List<LocationResponse> getLocationsByPeriod(Long userId, LocalDateTime startTime, LocalDateTime endTime) {
        log.info("사용자 {} 위치 이력 조회: {} ~ {}", userId, startTime, endTime);

        // 사용자 존재 확인
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. userId: " + userId));

        List<UserLocation> locations = userLocationRepository.findLocationsByUserIdAndPeriod(userId, startTime, endTime);
        return locations.stream()
                .map(LocationResponse::from)
                .toList();
    }

    /**
     * 최근 N개 위치 조회 (경로 추적용)
     */
    public List<LocationResponse> getLastNLocations(Long userId, int limit) {
        log.info("사용자 {} 최근 {} 개 위치 조회", userId, limit);

        // 사용자 존재 확인
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. userId: " + userId));

        Pageable pageable = PageRequest.of(0, limit);
        List<UserLocation> locations = userLocationRepository.findLastNLocationsByUserId(userId, pageable);

        // 시간순으로 정렬 (가장 오래된 것부터)
        locations.sort(Comparator.comparing(UserLocation::getCreatedAt));

        return locations.stream()
                .map(LocationResponse::from)
                .toList();
    }

    /**
     * 특정 반경 내의 모든 사용자 위치 조회 (관리자용)
     */
    public List<LocationResponse> getLocationsWithinRadius(double latitude, double longitude, double radius) {
        log.info("반경 조회: lat={}, lon={}, radius={}", latitude, longitude, radius);

        List<UserLocation> locations = userLocationRepository.findLocationsWithinRadius(latitude, longitude, radius);
        return locations.stream()
                .map(LocationResponse::from)
                .toList();
    }

    /**
     * 사용자의 이동 거리 계산 (SimpleSQL: ST_DistanceSphere 사용)
     * 최근 N개 위치로부터 총 이동 거리를 계산합니다.
     */
    public double calculateTravelDistance(Long userId, int limit) {
        log.info("사용자 {} 이동 거리 계산 (최근 {} 개)", userId, limit);

        List<LocationResponse> locations = getLastNLocations(userId, limit);

        if (locations.size() < 2) {
            log.warn("이동 거리 계산에 필요한 충분한 위치 데이터가 없습니다");
            return 0.0;
        }

        double totalDistance = 0.0;
        for (int i = 0; i < locations.size() - 1; i++) {
            LocationResponse current = locations.get(i);
            LocationResponse next = locations.get(i + 1);

            double distance = calculateHaversineDistance(
                    current.getLatitude(), current.getLongitude(),
                    next.getLatitude(), next.getLongitude()
            );
            totalDistance += distance;
        }

        log.info("총 이동 거리: {} 미터", totalDistance);
        return totalDistance;
    }

    /**
     * Haversine 공식을 사용한 두 점 사이의 거리 계산 (미터 단위)
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS = 6371000; // 미터

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }

    /**
     * 사용자 위치 이력 삭제 (GDPR 대응, 30일 이상 된 데이터)
     */
    @Transactional
    public void deleteOldLocationHistory(Long userId, int daysToKeep) {
        log.info("사용자 {} 오래된 위치 이력 삭제 ({}일 이전)", userId, daysToKeep);

        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
        userLocationRepository.deleteByUserIdAndCreatedAtBefore(userId, cutoffDate);

        log.info("삭제 완료");
    }

    /**
     * 사용자 위치 이력 조회 불가능 여부 확인 (프라이버시)
     * 실제 구현에서는 권한 검사 로직 추가 필요
     */
    public boolean canAccessUserLocation(Long requestingUserId, Long targetUserId) {
        // 자신의 위치는 조회 가능
        if (requestingUserId.equals(targetUserId)) {
            return true;
        }
        // 관리자는 조회 가능 (추후 권한 추가 필요)
        // isAdmin(requestingUserId)
        return false;
    }
}

