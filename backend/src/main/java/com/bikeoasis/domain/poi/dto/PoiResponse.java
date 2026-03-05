package com.bikeoasis.domain.poi.dto;

import java.time.LocalDateTime;

public record PoiResponse(
        Long id,
        String name,
        Double latitude,
        Double longitude,
        String category,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
