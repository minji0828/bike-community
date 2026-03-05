package com.bikeoasis.domain.course.dto.admin;

import java.time.LocalDateTime;

public record CourseWarningAdminResponse(
        Long warningId,
        Long courseId,
        String type,
        Integer severity,
        Double lat,
        Double lon,
        Double radiusM,
        String note,
        LocalDateTime validUntil
) {
}
