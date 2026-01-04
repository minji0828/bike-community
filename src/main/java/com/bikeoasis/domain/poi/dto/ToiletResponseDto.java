package com.bikeoasis.domain.poi.dto;

public record ToiletResponseDto(
        String name,
        String address,
        double latitude,
        double longitude,
        String openingHours
) {}
