package com.bikeoasis.domain.course.dto.admin;

/**
 * 태그 관리 Upsert 요청을 전달하는 DTO다.
 */
public record TagAdminUpsertRequest(
        String key,
        String label,
        String category,
        Boolean isActive
) {
}
