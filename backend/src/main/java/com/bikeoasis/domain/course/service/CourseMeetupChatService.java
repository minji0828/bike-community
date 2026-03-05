package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.MeetupChatMessageResponse;
import com.bikeoasis.domain.course.repository.CourseMeetupParticipantRepository;
import com.bikeoasis.domain.course.repository.CourseMeetupRepository;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.ConcurrentMap;

@Service
@RequiredArgsConstructor
public class CourseMeetupChatService {

    private static final int MAX_MESSAGE_LENGTH = 200;
    private static final int MAX_HISTORY_SIZE = 100;
    private static final String ANONYMOUS_DISPLAY_NAME = "익명";

    private final CourseMeetupRepository courseMeetupRepository;
    private final CourseMeetupParticipantRepository courseMeetupParticipantRepository;

    private final ConcurrentMap<Long, Deque<MeetupChatMessageResponse>> chatHistories = new ConcurrentHashMap<>();

    public MeetupChatMessageResponse publishMessage(Long meetupId, Long userId, String rawBody) {
        validateParticipant(meetupId, userId);

        if (rawBody == null || rawBody.isBlank()) {
            throw new BusinessException(400, "메시지 본문(body)은 필수입니다.");
        }

        String body = rawBody.trim();
        if (body.length() > MAX_MESSAGE_LENGTH) {
            throw new BusinessException(400, "메시지 길이는 200자 이하여야 합니다.");
        }

        MeetupChatMessageResponse message = new MeetupChatMessageResponse(
                UUID.randomUUID().toString().replace("-", ""),
                meetupId,
                ANONYMOUS_DISPLAY_NAME,
                body,
                OffsetDateTime.now(ZoneId.systemDefault())
        );

        Deque<MeetupChatMessageResponse> history = chatHistories.computeIfAbsent(meetupId, k -> new ConcurrentLinkedDeque<>());
        synchronized (history) {
            history.addLast(message);
            while (history.size() > MAX_HISTORY_SIZE) {
                history.pollFirst();
            }
        }

        return message;
    }

    public List<MeetupChatMessageResponse> getRecentMessages(Long meetupId, Long userId) {
        validateParticipant(meetupId, userId);

        Deque<MeetupChatMessageResponse> history = chatHistories.get(meetupId);
        if (history == null || history.isEmpty()) {
            return List.of();
        }

        synchronized (history) {
            return new ArrayList<>(history);
        }
    }

    public boolean isParticipant(Long meetupId, Long userId) {
        if (meetupId == null || userId == null) {
            return false;
        }
        return courseMeetupParticipantRepository.existsByMeetupIdAndUserId(meetupId, userId);
    }

    private void validateParticipant(Long meetupId, Long userId) {
        if (meetupId == null) {
            throw new BusinessException(400, "meetupId는 필수입니다.");
        }
        if (userId == null) {
            throw new BusinessException(401, "인증이 필요합니다.");
        }
        if (!courseMeetupRepository.existsById(meetupId)) {
            throw new BusinessException(404, "모임을 찾을 수 없습니다.");
        }
        if (!courseMeetupParticipantRepository.existsByMeetupIdAndUserId(meetupId, userId)) {
            throw new BusinessException(403, "모임 참가자만 채팅을 사용할 수 있습니다.");
        }
    }
}
