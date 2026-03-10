package com.bikeoasis.domain.course.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 코스 생성 요청을 전달하는 DTO다.
 */
@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CourseCreateRequest {
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
        @JsonAlias("lng")
        public double lon;
    }

    @Getter
    @NoArgsConstructor
    public static class WarningDto {
        private String type;
        private Integer severity;
        private Double lat;
        @JsonAlias("lng")
        private Double lon;
        private Double radiusM;
        private String note;
        private LocalDateTime validUntil;
    }
}
