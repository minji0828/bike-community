package com.bikeoasis.domain.user.repository;
}
    void deleteByUserIdAndCreatedAtBefore(Long userId, LocalDateTime before);
     */
     * 사용자의 위치 이력 삭제 (GDPR 대응)
    /**

    );
            org.springframework.data.domain.Pageable pageable
            @Param("userId") Long userId,
    List<UserLocation> findLastNLocationsByUserId(
        """)
        ORDER BY ul.createdAt DESC
        WHERE ul.user.id = :userId
        SELECT ul FROM UserLocation ul
    @Query(value = """
     */
     * 마지막 N개 위치 조회 (경로 추적)
    /**

    );
            @Param("radius") double radius
            @Param("lon") double lon,
            @Param("lat") double lat,
    List<UserLocation> findLocationsWithinRadius(
        """, nativeQuery = true)
        ORDER BY ul.createdAt DESC
        )
            :radius
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
            ul.location::geography,
        WHERE ST_DWithin(
        SELECT ul FROM UserLocation ul
    @Query(value = """
     */
     * 특정 반경 내의 모든 사용자 위치 조회 (관리자용)
    /**

    Optional<UserLocation> findByUserIdAndIsCurrentTrue(Long userId);
     */
     * 현재 위치 조회 (is_current = true)
    /**

    );
            @Param("endTime") LocalDateTime endTime
            @Param("startTime") LocalDateTime startTime,
            @Param("userId") Long userId,
    List<UserLocation> findLocationsByUserIdAndPeriod(
        """)
        ORDER BY ul.createdAt DESC
        AND ul.createdAt BETWEEN :startTime AND :endTime
        WHERE ul.user.id = :userId
        SELECT ul FROM UserLocation ul
    @Query("""
     */
     * 특정 기간의 위치 이력 조회
    /**

    Page<UserLocation> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
     */
     * 사용자의 위치 이력 조회 (페이지네이션)
    /**

    Optional<UserLocation> findLatestLocationByUserId(@Param("userId") Long userId);
        """)
        LIMIT 1
        ORDER BY ul.createdAt DESC
        WHERE ul.user.id = :userId
        SELECT ul FROM UserLocation ul
    @Query(value = """
     */
     * 사용자의 가장 최근 위치 조회
    /**

public interface UserLocationRepository extends JpaRepository<UserLocation, Long> {
@Repository
 */
 * 사용자 위치 저장소
/**

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.bikeoasis.domain.user.entity.UserLocation;


