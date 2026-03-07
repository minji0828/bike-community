package com.bikeoasis.domain.course.dto;

import java.time.LocalDateTime;

/**
 * 코스 하이라이트 응답 DTO다.
 */
public record CourseHighlightResponse(
        Long highlightId,
        Long courseId,
        String type,
        String title,
        String note,
        String visibility,
        Double lat,
        Double lon,
        Long authorUserId,
        boolean mine,
        LocalDateTime createdAt
) {
}
