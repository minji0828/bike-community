package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseMeetupParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 코스 모임 Participant 관련 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseMeetupParticipantRepository extends JpaRepository<CourseMeetupParticipant, Long> {

    boolean existsByMeetupIdAndUserId(Long meetupId, Long userId);

    long countByMeetupId(Long meetupId);

    Optional<CourseMeetupParticipant> findByMeetupIdAndUserId(Long meetupId, Long userId);

    @Query("""
            SELECT p.meetup.id, COUNT(p)
            FROM CourseMeetupParticipant p
            WHERE p.meetup.id IN :meetupIds
            GROUP BY p.meetup.id
            """)
    List<Object[]> countByMeetupIds(@Param("meetupIds") Collection<Long> meetupIds);

    @Query("""
            SELECT p.meetup.id
            FROM CourseMeetupParticipant p
            WHERE p.meetup.id IN :meetupIds
              AND p.user.id = :userId
            """)
    List<Long> findMeetupIdsByUserIdInMeetups(
            @Param("userId") Long userId,
            @Param("meetupIds") Collection<Long> meetupIds
    );
}
