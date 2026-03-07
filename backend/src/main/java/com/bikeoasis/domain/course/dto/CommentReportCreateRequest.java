package com.bikeoasis.domain.course.dto;

/**
 * 댓글 신고 생성 요청을 전달하는 DTO다.
 */
public record CommentReportCreateRequest(
        String reason,
        String note
) {
}
