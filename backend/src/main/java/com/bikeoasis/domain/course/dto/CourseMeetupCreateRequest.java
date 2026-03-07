package com.bikeoasis.domain.course.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 코스 모임 생성 요청을 전달하는 DTO다.
 */
@Getter
@NoArgsConstructor
public class CourseMeetupCreateRequest {

    private String title;
    private LocalDateTime startAt;
    private Double meetingPointLat;
    private Double meetingPointLon;
    private Integer capacity;
}
