package com.bikeoasis.domain.course.dto;

import java.util.List;

/**
 * 코스 Detail 응답을 전달하는 DTO다.
 */
public record CourseDetailResponse(
        Long id,
        String title,
        String visibility,
        String sourceType,
        String verifiedStatus,
        Double distanceKm,
        Integer estimatedDurationMin,
        Boolean loop,
        AmenitiesSummary amenitiesSummary,
        List<String> tags,
        List<WarningResponse> warnings,
        List<PointResponse> path
) {
    public record AmenitiesSummary(Integer toiletCount, Integer cafeCount) {
    }

    public record WarningResponse(String type, Integer severity, Double lat, Double lon, Double radiusM, String note, String validUntil) {
    }

    public record PointResponse(double lat, double lon) {
    }
}
