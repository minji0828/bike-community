package com.bikeoasis.domain.course.dto;

/**
 * 여행 컬렉션 생성을 위한 요청 DTO다.
 */
public record CourseCollectionCreateRequest(
        String title,
        String description,
        String region,
        String tripNotes,
        String visibility
) {
}
