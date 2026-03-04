package com.bikeoasis.domain.course.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CourseFromRidingCreateRequest {

    private Long ridingId;
    private String title;
    private String visibility;
    private String sourceType;

    // Notes/description are both accepted for compatibility with older docs.
    private String description;
    private String notes;

    private List<String> tags;
    private List<CourseCreateRequest.WarningDto> warnings;
}
