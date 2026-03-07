package com.bikeoasis.domain.poi.dto;

/**
 * Toilet 응답 Dto 관련 데이터 전달 객체다.
 */
public record ToiletResponseDto(
        String name,
        String address,
        double lat,
        double lon,
        String openingHours
) {}
