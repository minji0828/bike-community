package com.bikeoasis.domain.course.dto;

public record CommentReportCreateRequest(
        String reason,
        String note
) {
}
