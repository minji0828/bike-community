package com.bikeoasis.domain.course.dto.admin;

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
