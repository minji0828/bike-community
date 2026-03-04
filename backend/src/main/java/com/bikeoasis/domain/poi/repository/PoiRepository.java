package com.bikeoasis.domain.poi.repository;

import com.bikeoasis.domain.poi.entity.Poi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * POI 저장소
 */
public interface PoiRepository extends JpaRepository<Poi, Long> {

    /**
     * [이유]: PostGIS의 ST_DWithin을 사용하여 공간 인덱스를 활용한 고속 검색을 수행합니다.
     * :radius 단위는 meter입니다.
     */
    @Query(value = """
        SELECT p.*, ST_DistanceSphere(p.location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)) as distance
        FROM pois p
        WHERE ST_DWithin(
            p.location::geography, 
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
            :radius
        )
        ORDER BY distance ASC
        """, nativeQuery = true)
    List<Poi> findNearbyToilets(@Param("lat") double lat,
                                @Param("lon") double lon,
                                @Param("radius") double radius);

    /**
     * [이유]: 사용자의 전체 경로(LineString)를 따라 일정 거리(radius) 내에 있는 POI를 조회합니다.
     * ST_DWithin을 사용하여 인덱스를 태우고 고성능으로 필터링합니다.
     */
    @Query(value = """
    SELECT p.*
    FROM pois p
    WHERE ST_DWithin(
        p.location::geography, 
        ST_GeomFromText(:lineStringText, 4326)::geography, 
        :radius
    )
    ORDER BY ST_Distance(p.location::geography, ST_GeomFromText(:lineStringText, 4326)::geography) ASC
    """, nativeQuery = true)
    List<Poi> findToiletsAlongRoute(@Param("lineStringText") String lineStringText,
                                    @Param("radius") double radius);

    // === 증분 동기화 관련 메서드 ===

    /**
     * 외부 ID로 기존 데이터 조회 (증분 동기화)
     */
    Optional<Poi> findByExternalId(String externalId);

    /**
     * 외부 ID 리스트로 일괄 조회 (Bulk 동기화 최적화)
     * N+1 쿼리 문제 해결
     */
    List<Poi> findByExternalIdIn(List<String> externalIds);

    /**
     * 지정된 시간 이후 동기화된 데이터 조회
     */
    List<Poi> findByLastSyncedAtAfter(LocalDateTime lastSyncTime);

    /**
     * 동기화되지 않은 데이터 조회 (lastSyncedAt이 null인 경우)
     */
    @Query("SELECT p FROM Poi p WHERE p.lastSyncedAt IS NULL")
    List<Poi> findUnsyncedPois();

    /**
     * 특정 기간 내 생성된 데이터 조회
     */
    List<Poi> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
}
