package com.bikeoasis.global.config;

import com.bikeoasis.domain.course.service.CourseMeetupChatService;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Stomp JWT Channel 관련 애플리케이션 설정을 담당하는 클래스다.
 */
@Component
@RequiredArgsConstructor
public class StompJwtChannelInterceptor implements ChannelInterceptor {

    private static final Pattern MEETUP_DEST_PATTERN = Pattern.compile("^/(topic|app)/meetups/(\\d+)/(chat|chat\\.send|chat\\.history)$");

    @Qualifier("jwtDecoder")
    private final JwtDecoder appJwtDecoder;

    private final CourseMeetupChatService courseMeetupChatService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (command == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(command)) {
            authenticate(accessor);
            return message;
        }

        if (StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command)) {
            authorizeMeetupDestination(accessor);
        }

        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String authorization = firstHeader(accessor, HttpHeaders.AUTHORIZATION);
        if (authorization == null || authorization.isBlank()) {
            return;
        }

        String token = resolveBearerToken(authorization);
        Jwt jwt;
        try {
            jwt = appJwtDecoder.decode(token);
        } catch (Exception e) {
            throw new BusinessException(401, "유효하지 않은 access token입니다.");
        }

        String subject = jwt.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new BusinessException(401, "유효하지 않은 access token입니다.");
        }

        accessor.setUser(new UsernamePasswordAuthenticationToken(
                subject,
                token,
                List.of()
        ));
    }

    private void authorizeMeetupDestination(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            return;
        }

        Matcher matcher = MEETUP_DEST_PATTERN.matcher(destination);
        if (!matcher.matches()) {
            return;
        }

        Long meetupId = Long.parseLong(matcher.group(2));
        Long userId = resolveUserId(accessor.getUser());

        if (!courseMeetupChatService.isParticipant(meetupId, userId)) {
            throw new BusinessException(403, "모임 참가자만 채팅을 사용할 수 있습니다.");
        }
    }

    private Long resolveUserId(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new BusinessException(401, "채팅 인증이 필요합니다.");
        }
        try {
            return Long.parseLong(principal.getName());
        } catch (NumberFormatException e) {
            throw new BusinessException(401, "유효하지 않은 사용자 인증입니다.");
        }
    }

    private String resolveBearerToken(String authorization) {
        String value = authorization.trim();
        if (value.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = value.substring(7).trim();
            if (!token.isBlank()) {
                return token;
            }
        }
        throw new BusinessException(401, "Authorization 헤더 형식이 올바르지 않습니다.");
    }

    private String firstHeader(StompHeaderAccessor accessor, String headerName) {
        String value = accessor.getFirstNativeHeader(headerName);
        if (value != null) {
            return value;
        }
        return accessor.getFirstNativeHeader(headerName.toLowerCase());
    }
}
