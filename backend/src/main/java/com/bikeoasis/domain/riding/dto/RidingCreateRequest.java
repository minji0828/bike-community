package com.bikeoasis.domain.riding.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * 라이딩 생성 요청을 전달하는 DTO다.
 */
@Getter
@NoArgsConstructor
public class RidingCreateRequest {
    private String deviceUuid;
    private Long userId;
    private String title;
    private Double totalDistance;
    private Integer totalTime;
    private Double avgSpeed;
    private List<PointDto> path; // 주행 경로 좌표 리스트

    @Getter
    @NoArgsConstructor
    public static class PointDto {
        public double lat;
        @JsonAlias("lng")
        public double lon;
    }
}
