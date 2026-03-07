package com.bikeoasis.domain.course.dto;

import java.time.LocalDateTime;

/**
 * 코스 모임 응답을 전달하는 DTO다.
 */
public record CourseMeetupResponse(
        Long meetupId,
        Long courseId,
        String title,
        String status,
        LocalDateTime startAt,
        Double meetingPointLat,
        Double meetingPointLon,
        Integer capacity,
        long participantCount,
        boolean joined,
        boolean host
) {
}
