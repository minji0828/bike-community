package com.bikeoasis.domain.course.dto;

/**
 * 코스 하이라이트 생성을 위한 요청 DTO다.
 */
public record CourseHighlightCreateRequest(
        String type,
        String title,
        String note,
        Double lat,
        Double lon,
        String visibility
) {
}
