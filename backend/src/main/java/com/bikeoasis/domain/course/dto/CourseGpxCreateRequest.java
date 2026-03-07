package com.bikeoasis.domain.course.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 코스 GPX 생성 요청을 전달하는 DTO다.
 */
@Getter
@NoArgsConstructor
public class CourseGpxCreateRequest {
    private Long ownerUserId;
    private String deviceUuid;
    private String title;
    private String description;
    private String visibility;
    private String sourceType;
    private String gpxXml;
}
