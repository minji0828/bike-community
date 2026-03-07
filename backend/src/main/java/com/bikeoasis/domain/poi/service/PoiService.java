package com.bikeoasis.domain.poi.service;

import com.bikeoasis.domain.poi.dto.ToiletResponseDto;
import com.bikeoasis.domain.poi.entity.Poi;
import com.bikeoasis.domain.poi.repository.PoiRepository;
import com.bikeoasis.domain.riding.dto.RidingCreateRequest;
import com.bikeoasis.infrastructure.seoul_api.SeoulApiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * POI 관련 비즈니스 로직을 담당하는 서비스다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PoiService {
    private final PoiRepository poiRepository;
    private final SeoulApiClient seoulApiClient;
    private final GeometryFactory geometryFactory;

    @Value("${poi.fetch.page-size:1000}")
    private int pageSize;

    @Value("${poi.fetch.mode:incremental}")
    private String syncMode; // "full" 또는 "incremental"

    /**
     * 전체 새로고침 모드: 기존 데이터 모두 삭제 후 새로 동기화
     */
    @Transactional
    public void fetchAndSaveSeoulToiletsFullRefresh() {
        log.info("===== 전체 새로고침 모드 시작 =====");
        try {
            poiRepository.deleteAllInBatch();
            log.info("기존 화장실 데이터 모두 삭제");

            int startIndex = 1;
            int endIndex = pageSize;
            int totalSaved = 0;

            while (true) {
                SeoulApiClient.SeoulToiletApiResponse response = seoulApiClient.fetchToiletData(startIndex, endIndex);

                if (response.rows().isEmpty()) {
                    log.info("더 이상 데이터가 없습니다.");
                    break;
                }

                List<Poi> pois = response.rows().stream()
                        .map(this::convertRowToPoi)
                        .collect(Collectors.toList());

                poiRepository.saveAll(pois);
                totalSaved += pois.size();

                log.info("{}~{} 범위 저장 완료 ({}건, 누적: {}건)",
                        startIndex, endIndex, pois.size(), totalSaved);

                if (startIndex > response.totalCount()) {
                    break;
                }

                startIndex += pageSize;
                endIndex += pageSize;
            }

            log.info("===== 전체 새로고침 완료 (총 {}건) =====", totalSaved);

        } catch (Exception e) {
            log.error("전체 새로고침 중 오류 발생", e);
            throw new RuntimeException("POI 데이터 동기화 실패", e);
        }
    }

    /**
     * 증분 동기화 모드: 기존 데이터와 병합 (Bulk 처리 최적화)
     *
     * 성능 최적화:
     * - 일괄 조회: externalId 리스트로 한 번에 기존 데이터 조회
     * - 일괄 저장: 생성/수정 데이터를 배치로 저장
     * - 트랜잭션 1개: 페이지 단위로 트랜잭션 처리
     *
     * 결과: 2,000개 데이터 기준
     * - Before: 4,000 SQL (SELECT + INSERT/UPDATE) × N 페이지
     * - After: 페이지당 약 10 SQL 이하 (배치 사이즈 100 기준)
     */
    @Transactional
    public void fetchAndSaveSeoulToiletsIncremental() {
        log.info("===== 증분 동기화 모드 시작 (Bulk 처리) =====");
        long startTime = System.currentTimeMillis();

        try {
            int startIndex = 1;
            int endIndex = pageSize;
            int totalUpdated = 0;
            int totalCreated = 0;
            int pageCount = 0;

            while (true) {
                SeoulApiClient.SeoulToiletApiResponse response = seoulApiClient.fetchToiletData(startIndex, endIndex);

                if (response.rows().isEmpty()) {
                    log.info("더 이상 데이터가 없습니다.");
                    break;
                }

                pageCount++;
                List<SeoulApiClient.SeoulToiletRow> rows = response.rows();

                // ===== 1단계: 외부 ID로 일괄 조회 (1 SQL) =====
                List<String> externalIds = rows.stream()
                        .map(SeoulApiClient.SeoulToiletRow::externalId)
                        .toList();
                Map<String, Poi> existingPois = poiRepository.findByExternalIdIn(externalIds)
                        .stream()
                        .collect(java.util.HashMap::new,
                                (m, p) -> m.put(p.getExternalId(), p),
                                java.util.HashMap::putAll);

                // ===== 2단계: 데이터 분류 (메모리 처리) =====
                List<Poi> poisToCreate = new java.util.ArrayList<>();
                List<Poi> poisToUpdate = new java.util.ArrayList<>();

                for (SeoulApiClient.SeoulToiletRow row : rows) {
                    if (existingPois.containsKey(row.externalId())) {
                        // 기존 데이터 업데이트
                        Poi poi = existingPois.get(row.externalId());
                        poi.setName(row.name());
                        poi.setAddress(row.address());
                        Point newLocation = geometryFactory.createPoint(
                                new Coordinate(row.longitude(), row.latitude())
                        );
                        poi.setLocation(newLocation);
                        poi.setMetadata(Map.of("opening_hours", row.openingHours()));
                        poisToUpdate.add(poi);
                        totalUpdated++;
                    } else {
                        // 새로운 데이터 생성
                        Poi poi = convertRowToPoi(row);
                        poi.setExternalId(row.externalId());
                        poisToCreate.add(poi);
                        totalCreated++;
                    }
                }

                // ===== 3단계: 일괄 저장 (Bulk Insert/Update) =====
                if (!poisToCreate.isEmpty()) {
                    poiRepository.saveAll(poisToCreate);
                    log.debug("{}건의 새로운 POI 저장", poisToCreate.size());
                }

                if (!poisToUpdate.isEmpty()) {
                    poiRepository.saveAll(poisToUpdate);
                    log.debug("{}건의 기존 POI 업데이트", poisToUpdate.size());
                }

                log.info("[페이지 {}] {}~{} 범위 동기화 완료 | 생성: {}건, 업데이트: {}건",
                        pageCount, startIndex, endIndex, poisToCreate.size(), poisToUpdate.size());

                if (startIndex > response.totalCount()) {
                    break;
                }

                startIndex += pageSize;
                endIndex += pageSize;
            }

            long elapsedTime = System.currentTimeMillis() - startTime;
            log.info("===== 증분 동기화 완료 =====");
            log.info("총 생성: {}건, 업데이트: {}건 | 소요 시간: {}ms ({:.2f}초)",
                    totalCreated, totalUpdated, elapsedTime, elapsedTime / 1000.0);

        } catch (Exception e) {
            log.error("증분 동기화 중 오류 발생", e);
            throw new RuntimeException("POI 증분 동기화 실패", e);
        }
    }

    /**
     * 동기화 모드에 따라 자동 선택
     */
    @Transactional
    public void fetchAndSaveSeoulToilets() {
        if ("full".equalsIgnoreCase(syncMode)) {
            fetchAndSaveSeoulToiletsFullRefresh();
        } else {
            fetchAndSaveSeoulToiletsIncremental();
        }
    }

    /**
     * API Row를 Poi 엔티티로 변환
     */
    private Poi convertRowToPoi(SeoulApiClient.SeoulToiletRow row) {
        Point location = geometryFactory.createPoint(
                new Coordinate(row.longitude(), row.latitude())
        );

        return Poi.builder()
                .externalId(row.externalId())
                .name(row.name())
                .address(row.address())
                .location(location)
                .metadata(Map.of("opening_hours", row.openingHours()))
                .lastSyncedAt(LocalDateTime.now())
                .build();
    }

    /**
     * 특정 반경 내의 화장실 조회
     */
    public List<ToiletResponseDto> getNearbyToilets(double lat, double lon, double radius) {
        return poiRepository.findNearbyToilets(lat, lon, radius).stream()
                .map(this::convertToDto)
                .toList();
    }

    /**
     * 경로 따라 화장실 조회
     */
    public List<ToiletResponseDto> getToiletsAlongRoute(List<RidingCreateRequest.PointDto> path, double radius) {
        if (path == null || path.isEmpty()) return new ArrayList<>();
        String wkt = path.stream()
                .map(p -> p.getLon() + " " + p.getLat())
                .collect(Collectors.joining(", ", "LINESTRING(", ")"));
        return poiRepository.findToiletsAlongRoute(wkt, radius).stream()
                .map(this::convertToDto)
                .toList();
    }

    /**
     * Poi 엔티티를 응답 DTO로 변환
     */
    private ToiletResponseDto convertToDto(Poi poi) {
        String openingHours = (poi.getMetadata() != null) ?
                (String) poi.getMetadata().getOrDefault("opening_hours", "정보 없음") : "정보 없음";

        return new ToiletResponseDto(
                poi.getName(),
                poi.getAddress(),
                poi.getLocation().getY(),
                poi.getLocation().getX(),
                openingHours
        );
    }
}