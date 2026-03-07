package com.bikeoasis.domain.course.dto.admin;

/**
 * 코스 메타데이터 Recalculate 응답을 전달하는 DTO다.
 */
public record CourseMetadataRecalculateResponse(
        Long courseId,
        Double distanceKm,
        Integer estimatedDurationMin,
        Boolean loop,
        Double bboxMinLon,
        Double bboxMinLat,
        Double bboxMaxLon,
        Double bboxMaxLat,
        Integer toiletCount
) {
}
