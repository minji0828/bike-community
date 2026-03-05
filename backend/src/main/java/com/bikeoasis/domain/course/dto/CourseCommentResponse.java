package com.bikeoasis.domain.course.dto;

import java.time.OffsetDateTime;

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
