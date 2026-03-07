package com.bikeoasis.domain.course.dto;

import java.util.List;

/**
 * 코스 Featured 응답을 전달하는 DTO다.
 */
public record CourseFeaturedResponse(
        Long id,
        String title,
        Double distanceKm,
        Integer estimatedDurationMin,
        Boolean loop,
        Integer featuredRank,
        List<String> tags
) {
}
