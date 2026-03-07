package com.bikeoasis.domain.course.dto.admin;

import java.time.LocalDateTime;

/**
 * 코스 경고 관리 생성 요청을 전달하는 DTO다.
 */
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
