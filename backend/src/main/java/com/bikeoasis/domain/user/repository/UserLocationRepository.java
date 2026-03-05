package com.bikeoasis.domain.user.repository;

import com.bikeoasis.domain.user.entity.UserLocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 사용자 위치 저장소
 */
@Repository
public interface UserLocationRepository extends JpaRepository<UserLocation, Long> {

    /**
     * 사용자의 가장 최근 위치 조회
     */
    Optional<UserLocation> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * 사용자의 위치 이력 조회 (페이지네이션)
     */
    Page<UserLocation> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * 특정 기간의 위치 이력 조회
     */
    @Query("""
        SELECT ul FROM UserLocation ul
        WHERE ul.user.id = :userId
        AND ul.createdAt BETWEEN :startTime AND :endTime
        ORDER BY ul.createdAt DESC
        """)
    List<UserLocation> findLocationsByUserIdAndPeriod(
            @Param("userId") Long userId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );

    /**
     * 현재 위치 조회 (is_current = true)
     */
    Optional<UserLocation> findByUserIdAndIsCurrentTrue(Long userId);

    /**
     * 특정 반경 내의 모든 사용자 위치 조회 (관리자용)
     */
    @Query(value = """
        SELECT ul.* FROM user_locations ul
        WHERE ST_DWithin(
            ul.location::geography,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
            :radius
        )
        ORDER BY ul.created_at DESC
        """, nativeQuery = true)
    List<UserLocation> findLocationsWithinRadius(
            @Param("lat") double lat,
            @Param("lon") double lon,
            @Param("radius") double radius
    );

    /**
     * 마지막 N개 위치 조회 (경로 추적)
     */
    @Query(value = """
        SELECT ul FROM UserLocation ul
        WHERE ul.user.id = :userId
        ORDER BY ul.createdAt DESC
        """)
    List<UserLocation> findLastNLocationsByUserId(
            @Param("userId") Long userId,
            Pageable pageable
    );

    /**
     * 사용자의 위치 이력 삭제 (GDPR 대응)
     */
    void deleteByUserIdAndCreatedAtBefore(Long userId, LocalDateTime before);

    /**
     * PostGIS를 사용한 총 이동 거리 계산
     * 최근 N개 위치의 연속된 점들 사이 거리의 합계를 계산합니다.
     * ST_DistanceSphere로 지구 구면 거리를 정확히 계산합니다. (미터 단위)
     */
    @Query(value = """
        SELECT COALESCE(SUM(ST_DistanceSphere(LAG(location) OVER (ORDER BY created_at ASC), location)), 0) as total_distance
        FROM (
            SELECT location, created_at
            FROM user_locations
            WHERE user_id = :userId
            ORDER BY created_at DESC
            LIMIT :limit
        ) t
        """, nativeQuery = true)
    Double calculateTravelDistancePostGIS(
            @Param("userId") Long userId,
            @Param("limit") int limit
    );
}

