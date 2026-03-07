package com.bikeoasis.domain.course.dto;

import java.time.LocalDateTime;

/**
 * 여행 컬렉션 목록용 요약 응답 DTO다.
 */
public record CourseCollectionSummaryResponse(
        Long collectionId,
        String title,
        String region,
        String visibility,
        int itemCount,
        LocalDateTime updatedAt
) {
}
