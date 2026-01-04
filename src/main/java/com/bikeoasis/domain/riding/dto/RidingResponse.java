package com.bikeoasis.domain.riding.dto;

import java.time.LocalDateTime;

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
