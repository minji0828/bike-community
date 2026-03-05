package com.bikeoasis.domain.course.dto.admin;

public record TagAdminUpsertRequest(
        String key,
        String label,
        String category,
        Boolean isActive
) {
}
