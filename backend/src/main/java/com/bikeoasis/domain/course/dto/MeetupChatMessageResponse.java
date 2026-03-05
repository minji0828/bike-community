package com.bikeoasis.domain.course.dto;

import java.time.OffsetDateTime;

public record MeetupChatMessageResponse(
        String messageId,
        Long meetupId,
        String authorDisplayName,
        String body,
        OffsetDateTime sentAt
) {
}
