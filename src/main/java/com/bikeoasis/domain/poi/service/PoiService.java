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
     * 증분 동기화 모드: 기존 데이터와 병합
     */
    @Transactional
    public void fetchAndSaveSeoulToiletsIncremental() {
        log.info("===== 증분 동기화 모드 시작 =====");
        try {
            int startIndex = 1;
            int endIndex = pageSize;
            int totalUpdated = 0;
            int totalCreated = 0;

            while (true) {
                SeoulApiClient.SeoulToiletApiResponse response = seoulApiClient.fetchToiletData(startIndex, endIndex);

                if (response.rows().isEmpty()) {
                    log.info("더 이상 데이터가 없습니다.");
                    break;
                }

                for (SeoulApiClient.SeoulToiletRow row : response.rows()) {
                    Optional<Poi> existing = poiRepository.findByExternalId(row.externalId());

                    if (existing.isPresent()) {
                        // 기존 데이터 업데이트
                        Poi poi = existing.get();
                        poi.setName(row.name());
                        poi.setAddress(row.address());
                        Point newLocation = geometryFactory.createPoint(
                                new Coordinate(row.longitude(), row.latitude())
                        );
                        poi.setLocation(newLocation);
                        poi.setMetadata(Map.of("opening_hours", row.openingHours()));

                        poiRepository.save(poi);
                        totalUpdated++;
                    } else {
                        // 새로운 데이터 생성
                        Poi poi = convertRowToPoi(row);
                        poi.setExternalId(row.externalId());
                        poiRepository.save(poi);
                        totalCreated++;
                    }
                }

                log.info("{}~{} 범위 동기화 완료 (생성: {}건, 업데이트: {}건)",
                        startIndex, endIndex, totalCreated, totalUpdated);

                if (startIndex > response.totalCount()) {
                    break;
                }

                startIndex += pageSize;
                endIndex += pageSize;
            }

            log.info("===== 증분 동기화 완료 (생성: {}건, 업데이트: {}건) =====",
                    totalCreated, totalUpdated);

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