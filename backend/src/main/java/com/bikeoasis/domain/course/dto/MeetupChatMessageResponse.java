package com.bikeoasis.domain.course.dto;

import java.time.OffsetDateTime;

/**
 * 모임 채팅 Message 응답을 전달하는 DTO다.
 */
public record MeetupChatMessageResponse(
        String messageId,
        Long meetupId,
        String authorDisplayName,
        String body,
        OffsetDateTime sentAt
) {
}
