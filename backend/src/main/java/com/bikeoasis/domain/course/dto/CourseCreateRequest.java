package com.bikeoasis.domain.course.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@NoArgsConstructor
public class CourseCreateRequest {
    private Long ownerUserId;
    private String deviceUuid;
    private String title;
    private String description;
    private String visibility;
    private String sourceType;
    private List<PointDto> path;
    private List<String> tags;
    private List<WarningDto> warnings;

    @Getter
    @NoArgsConstructor
    public static class PointDto {
        public double lat;
        public double lon;
    }

    @Getter
    @NoArgsConstructor
    public static class WarningDto {
        private String type;
        private Integer severity;
        private Double lat;
        private Double lon;
        private Double radiusM;
        private String note;
        private LocalDateTime validUntil;
    }
}
