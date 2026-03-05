package com.bikeoasis.domain.user.dto;

import java.time.LocalDateTime;

/**
 * 사용자 응답 DTO
 */
public record UserResponse(
        Long id,
        String email,
        String username,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
