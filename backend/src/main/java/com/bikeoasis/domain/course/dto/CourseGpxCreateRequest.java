package com.bikeoasis.domain.course.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

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
