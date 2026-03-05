package com.bikeoasis.domain.course.dto.admin;

public record TagAdminResponse(
        Long id,
        String key,
        String label,
        String category,
        boolean isActive
) {
}
