package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.CourseMeetupCreateRequest;
import com.bikeoasis.domain.course.dto.CourseMeetupResponse;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.CourseMeetup;
import com.bikeoasis.domain.course.entity.CourseMeetupParticipant;
import com.bikeoasis.domain.course.enums.CourseMeetupStatus;
import com.bikeoasis.domain.course.repository.CourseMeetupParticipantRepository;
import com.bikeoasis.domain.course.repository.CourseMeetupRepository;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.domain.user.entity.User;
import com.bikeoasis.domain.user.repository.UserRepository;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 코스 모임 관련 비즈니스 로직을 담당하는 서비스다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseMeetupService {

    private final CourseMeetupRepository courseMeetupRepository;
    private final CourseMeetupParticipantRepository courseMeetupParticipantRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long createMeetup(Long courseId, Long hostUserId, CourseMeetupCreateRequest request) {
        // MTP-P-001, MTP-P-002: 모임 생성은 인증 사용자만 가능하며 초기 상태는 OPEN이다.
        validateCreateRequest(request);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));
        User hostUser = userRepository.findById(hostUserId)
                .orElseThrow(() -> new BusinessException(401, "인증이 필요합니다."));

        CourseMeetup meetup = CourseMeetup.builder()
                .course(course)
                .hostUser(hostUser)
                .title(request.getTitle().trim())
                .startAt(request.getStartAt())
                .meetingPointLat(request.getMeetingPointLat())
                .meetingPointLon(request.getMeetingPointLon())
                .capacity(request.getCapacity())
                .status(CourseMeetupStatus.OPEN)
                .build();

        CourseMeetup saved = courseMeetupRepository.save(meetup);

        // MTP-P-003: host는 모임 생성과 동시에 참가자로 등록된다.
        courseMeetupParticipantRepository.save(CourseMeetupParticipant.builder()
                .meetup(saved)
                .user(hostUser)
                .build());

        return saved.getId();
    }

    public List<CourseMeetupResponse> listMeetups(Long courseId, String status, Long currentUserId) {
        if (!courseRepository.existsById(courseId)) {
            throw new BusinessException(404, "코스를 찾을 수 없습니다.");
        }

        // MTP-P-008: 상태 필터 기본값은 OPEN이며 all일 때만 전체 조회한다.
        CourseMeetupStatus parsedStatus = parseStatus(status);
        List<CourseMeetup> meetups = courseMeetupRepository.findByCourseIdAndOptionalStatus(courseId, parsedStatus);

        if (meetups.isEmpty()) {
            return List.of();
        }

        List<Long> meetupIds = meetups.stream().map(CourseMeetup::getId).toList();
        Map<Long, Long> countMap = toCountMap(courseMeetupParticipantRepository.countByMeetupIds(meetupIds));

        Set<Long> joinedIds = Set.of();
        if (currentUserId != null) {
            joinedIds = courseMeetupParticipantRepository.findMeetupIdsByUserIdInMeetups(currentUserId, meetupIds)
                    .stream()
                    .collect(Collectors.toSet());
        }

        Set<Long> finalJoinedIds = joinedIds;
        return meetups.stream()
                .map(meetup -> toResponse(meetup, currentUserId, countMap.getOrDefault(meetup.getId(), 0L), finalJoinedIds.contains(meetup.getId())))
                .toList();
    }

    public CourseMeetupResponse getMeetup(Long meetupId, Long currentUserId) {
        CourseMeetup meetup = courseMeetupRepository.findById(meetupId)
                .orElseThrow(() -> new BusinessException(404, "모임을 찾을 수 없습니다."));
        long participantCount = courseMeetupParticipantRepository.countByMeetupId(meetup.getId());
        boolean joined = currentUserId != null
                && courseMeetupParticipantRepository.existsByMeetupIdAndUserId(meetup.getId(), currentUserId);
        return toResponse(meetup, currentUserId, participantCount, joined);
    }

    @Transactional
    public void joinMeetup(Long meetupId, Long userId) {
        CourseMeetup meetup = courseMeetupRepository.findByIdForUpdate(meetupId)
                .orElseThrow(() -> new BusinessException(404, "모임을 찾을 수 없습니다."));

        // MTP-P-004: OPEN 상태가 아니면 참가할 수 없다.
        if (meetup.getStatus() != CourseMeetupStatus.OPEN) {
            throw new BusinessException(409, "참여할 수 없는 모임 상태입니다.");
        }

        // MTP-P-005: 동일 사용자의 중복 참가 요청은 idempotent 성공으로 본다.
        if (courseMeetupParticipantRepository.existsByMeetupIdAndUserId(meetupId, userId)) {
            return;
        }

        // MTP-P-006: 정원이 설정된 모임은 현재 인원 이상이 되면 참가를 거절한다.
        Integer capacity = meetup.getCapacity();
        if (capacity != null && capacity > 0) {
            long participantCount = courseMeetupParticipantRepository.countByMeetupId(meetupId);
            if (participantCount >= capacity) {
                throw new BusinessException(409, "모임 정원이 가득 찼습니다.");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(401, "인증이 필요합니다."));

        try {
            courseMeetupParticipantRepository.saveAndFlush(CourseMeetupParticipant.builder()
                    .meetup(meetup)
                    .user(user)
                    .build());
        } catch (DataIntegrityViolationException e) {
            // concurrent duplicate join: idempotent success
        }
    }

    @Transactional
    public void leaveMeetup(Long meetupId, Long userId) {
        CourseMeetup meetup = courseMeetupRepository.findByIdForUpdate(meetupId)
                .orElseThrow(() -> new BusinessException(404, "모임을 찾을 수 없습니다."));

        // MTP-P-007: 모임장은 leave할 수 없다.
        if (meetup.getHostUser().getId().equals(userId)) {
            throw new BusinessException(403, "모임장은 leave할 수 없습니다.");
        }

        courseMeetupParticipantRepository.findByMeetupIdAndUserId(meetupId, userId)
                .ifPresent(courseMeetupParticipantRepository::delete);
    }

    private CourseMeetupResponse toResponse(CourseMeetup meetup,
                                           Long currentUserId,
                                           long participantCount,
                                           boolean joined) {
        boolean host = currentUserId != null && meetup.getHostUser().getId().equals(currentUserId);

        return new CourseMeetupResponse(
                meetup.getId(),
                meetup.getCourse().getId(),
                meetup.getTitle(),
                meetup.getStatus().name().toLowerCase(),
                meetup.getStartAt(),
                meetup.getMeetingPointLat(),
                meetup.getMeetingPointLon(),
                meetup.getCapacity(),
                participantCount,
                joined,
                host
        );
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        if (rows == null) {
            return map;
        }
        for (Object[] row : rows) {
            if (row == null || row.length < 2) {
                continue;
            }
            Long meetupId = row[0] instanceof Long v ? v : null;
            Long count = row[1] instanceof Long v ? v : null;
            if (meetupId != null && count != null) {
                map.put(meetupId, count);
            }
        }
        return map;
    }

    private CourseMeetupStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return CourseMeetupStatus.OPEN;
        }
        if ("all".equalsIgnoreCase(raw)) {
            return null;
        }
        try {
            return CourseMeetupStatus.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(400, "status 값이 올바르지 않습니다.");
        }
    }

    private void validateCreateRequest(CourseMeetupCreateRequest request) {
        if (request == null) {
            throw new BusinessException(400, "요청 본문이 필요합니다.");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BusinessException(400, "title은 필수입니다.");
        }
        if (request.getStartAt() == null) {
            throw new BusinessException(400, "startAt은 필수입니다.");
        }

        // VAL-P-002: 시작 시각은 현재 이후이면서 180일 이내여야 한다.
        LocalDateTime now = LocalDateTime.now();
        if (request.getStartAt().isBefore(now.minusMinutes(5))) {
            throw new BusinessException(400, "startAt은 현재 시각 이후여야 합니다.");
        }
        if (request.getStartAt().isAfter(now.plusDays(180))) {
            throw new BusinessException(400, "startAt은 180일 이내여야 합니다.");
        }

        // VAL-P-003, VAL-P-004: meetingPointLat/lon은 쌍으로 전달되고 좌표 범위를 만족해야 한다.
        if ((request.getMeetingPointLat() == null) != (request.getMeetingPointLon() == null)) {
            throw new BusinessException(400, "meetingPointLat/lon은 함께 전달해야 합니다.");
        }
        if (request.getMeetingPointLat() != null) {
            if (request.getMeetingPointLat() < -90 || request.getMeetingPointLat() > 90) {
                throw new BusinessException(400, "meetingPointLat 범위가 올바르지 않습니다.");
            }
            if (request.getMeetingPointLon() < -180 || request.getMeetingPointLon() > 180) {
                throw new BusinessException(400, "meetingPointLon 범위가 올바르지 않습니다.");
            }
        }

        // VAL-P-005: capacity는 1 이상 100 이하만 허용한다.
        if (request.getCapacity() != null && request.getCapacity() < 1) {
            throw new BusinessException(400, "capacity는 1 이상이어야 합니다.");
        }
        if (request.getCapacity() != null && request.getCapacity() > 100) {
            throw new BusinessException(400, "capacity는 100 이하여야 합니다.");
        }
    }
}
