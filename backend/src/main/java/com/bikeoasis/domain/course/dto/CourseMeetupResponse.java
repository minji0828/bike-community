package com.bikeoasis.domain.course.dto;

import java.time.LocalDateTime;

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
