package com.bikeoasis.domain.course.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 코스 GPX 생성 요청을 전달하는 DTO다.
 */
@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CourseGpxCreateRequest {
    private String deviceUuid;
    private String title;
    private String description;
    private String visibility;
    private String sourceType;
    private String gpxXml;
}
