package com.bikeoasis.domain.poi.dto;

import java.time.LocalDateTime;

/**
 * POI 응답을 전달하는 DTO다.
 */
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
