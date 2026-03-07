package com.bikeoasis.domain.course.dto.admin;

import java.time.LocalDateTime;

/**
 * 코스 경고 관리 응답을 전달하는 DTO다.
 */
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
