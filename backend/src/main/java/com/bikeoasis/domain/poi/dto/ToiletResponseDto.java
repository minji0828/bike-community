package com.bikeoasis.domain.poi.dto;

public record ToiletResponseDto(
        String name,
        String address,
        double lat,
        double lon,
        String openingHours
) {}
