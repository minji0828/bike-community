package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseMeetupParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CourseMeetupParticipantRepository extends JpaRepository<CourseMeetupParticipant, Long> {

    boolean existsByMeetupIdAndUserId(Long meetupId, Long userId);

    long countByMeetupId(Long meetupId);

    Optional<CourseMeetupParticipant> findByMeetupIdAndUserId(Long meetupId, Long userId);
}
