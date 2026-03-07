package com.bikeoasis.domain.riding.dto;

import java.time.LocalDateTime;

/**
 * 라이딩 응답을 전달하는 DTO다.
 */
public record RidingResponse(
        Long id,
        Long userId,
        Double distance,
        Long duration,
        String route,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
