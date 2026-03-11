package com.bikeoasis.domain.riding.service;

import com.bikeoasis.domain.riding.dto.RidingCreateRequest;
import com.bikeoasis.domain.riding.entity.Riding;
import com.bikeoasis.domain.riding.repository.RidingRepository;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 라이딩 관련 비즈니스 로직을 담당하는 서비스다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RidingService {
    private static final int SRID_WGS84 = 4326;

    private final RidingRepository ridingRepository;
    private final GeometryFactory geometryFactory;

    @Transactional
    public Long saveRiding(RidingCreateRequest request, Long requesterUserId) {
        // RID-P-001, RID-P-002: 라이딩 저장은 인증 사용자만 가능하며 소유권은 JWT sub로 확정한다.
        Long resolvedRequesterUserId = requireRequesterUserId(requesterUserId);
        if (request == null) {
            throw new BusinessException(400, "요청 본문이 필요합니다.");
        }
        // RID-P-003, RID-P-004: deviceUuid는 필수이고 path는 최소 2개 좌표가 필요하다.
        if (request.getDeviceUuid() == null || request.getDeviceUuid().isBlank()) {
            throw new BusinessException(400, "deviceUuid는 필수입니다.");
        }
        if (request.getPath() == null || request.getPath().size() < 2) {
            throw new BusinessException(400, "path는 최소 2개 좌표가 필요합니다.");
        }

        // RID-P-005, RID-P-006: 좌표 범위를 검증하고 내부 지오메트리는 항상 (lon, lat) 순서로 만든다.
        Coordinate[] coordinates = request.getPath().stream()
                .map(p -> {
                    validateLatLon(p.getLat(), p.getLon());
                    return new Coordinate(p.getLon(), p.getLat());
                })
                .toArray(Coordinate[]::new);

        LineString lineString = geometryFactory.createLineString(coordinates);
        lineString.setSRID(SRID_WGS84);

        Riding riding = Riding.builder()
                .deviceUuid(request.getDeviceUuid())
                .userId(resolvedRequesterUserId)
                .title(request.getTitle())
                .totalDistance(request.getTotalDistance())
                .totalTime(request.getTotalTime())
                .avgSpeed(request.getAvgSpeed())
                .pathData(lineString)
                .build();

        return ridingRepository.save(riding).getId();
    }

    private Long requireRequesterUserId(Long requesterUserId) {
        if (requesterUserId == null) {
            throw new BusinessException(401, "인증이 필요합니다.");
        }
        return requesterUserId;
    }

    private void validateLatLon(double lat, double lon) {
        if (Double.isNaN(lat) || Double.isNaN(lon) || Double.isInfinite(lat) || Double.isInfinite(lon)) {
            throw new BusinessException(400, "유효하지 않은 좌표입니다.");
        }
        if (lat < -90.0 || lat > 90.0) {
            throw new BusinessException(400, "위도(lat) 범위가 올바르지 않습니다.");
        }
        if (lon < -180.0 || lon > 180.0) {
            throw new BusinessException(400, "경도(lon) 범위가 올바르지 않습니다.");
        }
    }
}
