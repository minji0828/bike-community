package com.bikeoasis.domain.course.dto.admin;

/**
 * 태그 관리 응답을 전달하는 DTO다.
 */
public record TagAdminResponse(
        Long id,
        String key,
        String label,
        String category,
        boolean isActive
) {
}
