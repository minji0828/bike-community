package com.bikeoasis.domain.riding.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

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
        public double lon;
    }
}