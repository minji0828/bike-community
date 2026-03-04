package com.bikeoasis.domain.course.dto;

import java.util.List;

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
