package com.bikeoasis.domain.course.dto;

/**
 * 여행 컬렉션 내부 코스 항목 응답 DTO다.
 */
public record CourseCollectionItemResponse(
        Long itemId,
        Long courseId,
        String courseTitle,
        Double distanceKm,
        Integer estimatedDurationMin,
        Integer positionIndex
) {
}
