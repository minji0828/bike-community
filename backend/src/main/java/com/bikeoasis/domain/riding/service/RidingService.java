package com.bikeoasis.domain.riding.service;

import com.bikeoasis.domain.riding.dto.RidingCreateRequest;
import com.bikeoasis.domain.riding.entity.Riding;
import com.bikeoasis.domain.riding.repository.RidingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RidingService {
    private final RidingRepository ridingRepository;
    private final GeometryFactory geometryFactory; // PostGisConfig에서 빈 등록 필요

    @Transactional
    public Long saveRiding(RidingCreateRequest request) {
        // 1. DTO의 좌표 리스트를 JTS Coordinate 배열로 변환
        Coordinate[] coordinates = request.getPath().stream()
                .map(p -> new Coordinate(p.getLon(), p.getLat())) // (lon, lat) 순서 주의!
                .toArray(Coordinate[]::new);

        // 2. LineString 생성
        LineString lineString = geometryFactory.createLineString(coordinates);

        // 3. 엔티티 빌드 및 저장
        Riding riding = Riding.builder()
                .deviceUuid(request.getDeviceUuid())
                .userId(request.getUserId())
                .title(request.getTitle())
                .totalDistance(request.getTotalDistance())
                .totalTime(request.getTotalTime())
                .avgSpeed(request.getAvgSpeed())
                .pathData(lineString)
                .build();

        return ridingRepository.save(riding).getId();
    }
}