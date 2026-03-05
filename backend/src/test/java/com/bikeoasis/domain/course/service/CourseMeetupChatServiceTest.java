package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.MeetupChatMessageResponse;
import com.bikeoasis.domain.course.repository.CourseMeetupParticipantRepository;
import com.bikeoasis.domain.course.repository.CourseMeetupRepository;
import com.bikeoasis.global.error.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class CourseMeetupChatServiceTest {

    @Mock
    private CourseMeetupRepository courseMeetupRepository;

    @Mock
    private CourseMeetupParticipantRepository courseMeetupParticipantRepository;

    private CourseMeetupChatService courseMeetupChatService;

    @BeforeEach
    void setUp() {
        courseMeetupChatService = new CourseMeetupChatService(
                courseMeetupRepository,
                courseMeetupParticipantRepository
        );
    }

    @Test
    void publishMessage_success_whenParticipant() {
        Long meetupId = 10L;
        Long userId = 99L;

        given(courseMeetupRepository.existsById(meetupId)).willReturn(true);
        given(courseMeetupParticipantRepository.existsByMeetupIdAndUserId(meetupId, userId)).willReturn(true);

        MeetupChatMessageResponse sent = courseMeetupChatService.publishMessage(meetupId, userId, "  안녕하세요  ");
        List<MeetupChatMessageResponse> history = courseMeetupChatService.getRecentMessages(meetupId, userId);

        assertThat(sent.meetupId()).isEqualTo(meetupId);
        assertThat(sent.authorDisplayName()).isEqualTo("익명");
        assertThat(sent.body()).isEqualTo("안녕하세요");
        assertThat(history).hasSize(1);
        assertThat(history.get(0).messageId()).isEqualTo(sent.messageId());
    }

    @Test
    void publishMessage_fail_whenNotParticipant() {
        Long meetupId = 20L;
        Long userId = 77L;

        given(courseMeetupRepository.existsById(meetupId)).willReturn(true);
        given(courseMeetupParticipantRepository.existsByMeetupIdAndUserId(meetupId, userId)).willReturn(false);

        assertThatThrownBy(() -> courseMeetupChatService.publishMessage(meetupId, userId, "테스트"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("모임 참가자만 채팅을 사용할 수 있습니다.");
    }

    @Test
    void publishMessage_fail_whenTooLong() {
        Long meetupId = 30L;
        Long userId = 88L;
        String tooLong = "a".repeat(201);

        given(courseMeetupRepository.existsById(meetupId)).willReturn(true);
        given(courseMeetupParticipantRepository.existsByMeetupIdAndUserId(meetupId, userId)).willReturn(true);

        assertThatThrownBy(() -> courseMeetupChatService.publishMessage(meetupId, userId, tooLong))
                .isInstanceOf(BusinessException.class)
                .hasMessage("메시지 길이는 200자 이하여야 합니다.");
    }
}
