package com.bikeoasis.domain.course.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class CourseMeetupCreateRequest {

    private String title;
    private LocalDateTime startAt;
    private Double meetingPointLat;
    private Double meetingPointLon;
    private Integer capacity;
}
