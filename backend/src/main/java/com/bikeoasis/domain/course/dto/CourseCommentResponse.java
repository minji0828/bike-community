package com.bikeoasis.domain.course.dto;

import java.time.OffsetDateTime;

/**
 * 코스 댓글 응답을 전달하는 DTO다.
 */
public record CourseCommentResponse(
        Long id,
        Author author,
        String body,
        OffsetDateTime createdAt,
        boolean isMine
) {
    public record Author(String displayName) {
    }
}
