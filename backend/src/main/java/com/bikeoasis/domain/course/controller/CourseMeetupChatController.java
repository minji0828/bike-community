package com.bikeoasis.domain.course.controller;

import com.bikeoasis.domain.course.dto.MeetupChatMessageResponse;
import com.bikeoasis.domain.course.dto.MeetupChatSendRequest;
import com.bikeoasis.domain.course.service.CourseMeetupChatService;
import com.bikeoasis.global.auth.AuthenticatedUserResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;

@Controller
@RequiredArgsConstructor
public class CourseMeetupChatController {

    private final CourseMeetupChatService courseMeetupChatService;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @MessageMapping("/meetups/{meetupId}/chat.send")
    public void sendMessage(
            @DestinationVariable Long meetupId,
            MeetupChatSendRequest request,
            Principal principal
    ) {
        Long userId = authenticatedUserResolver.requireUserId(principal);
        String body = request == null ? null : request.body();
        MeetupChatMessageResponse message = courseMeetupChatService.publishMessage(meetupId, userId, body);
        simpMessagingTemplate.convertAndSend("/topic/meetups/" + meetupId + "/chat", message);
    }

    @MessageMapping("/meetups/{meetupId}/chat.history")
    public void requestHistory(
            @DestinationVariable Long meetupId,
            Principal principal
    ) {
        Long userId = authenticatedUserResolver.requireUserId(principal);
        List<MeetupChatMessageResponse> history = courseMeetupChatService.getRecentMessages(meetupId, userId);
        simpMessagingTemplate.convertAndSendToUser(
                principal.getName(),
                "/queue/meetups/" + meetupId + "/chat.history",
                history
        );
    }
}
