package com.bikeoasis.domain.poi.dto;

import com.bikeoasis.domain.poi.enums.PoiCategory;

/**
 * POI 생성 요청 DTO
 */
public record PoiCreateRequest(
        String name,
        Double latitude,
        Double longitude,
        PoiCategory category,
        String description
) {}
