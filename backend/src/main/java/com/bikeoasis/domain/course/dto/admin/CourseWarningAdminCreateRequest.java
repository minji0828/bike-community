package com.bikeoasis.domain.course.dto.admin;

import java.time.LocalDateTime;

public record CourseWarningAdminCreateRequest(
        String type,
        Integer severity,
        Double lat,
        Double lon,
        Double radiusM,
        String note,
        LocalDateTime validUntil
) {
}
