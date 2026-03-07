package com.bikeoasis.domain.course.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 여행 컬렉션 상세 응답 DTO다.
 */
public record CourseCollectionDetailResponse(
        Long collectionId,
        Long ownerUserId,
        String title,
        String description,
        String region,
        String tripNotes,
        String visibility,
        int itemCount,
        List<CourseCollectionItemResponse> items,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean mine
) {
}
