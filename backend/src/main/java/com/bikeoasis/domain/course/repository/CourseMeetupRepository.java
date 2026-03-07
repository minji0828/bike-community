package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseMeetup;
import com.bikeoasis.domain.course.enums.CourseMeetupStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * 코스 모임 관련 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseMeetupRepository extends JpaRepository<CourseMeetup, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints({
            @QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000")
    })
    @Query("""
            SELECT m
            FROM CourseMeetup m
            WHERE m.id = :meetupId
            """)
    Optional<CourseMeetup> findByIdForUpdate(@Param("meetupId") Long meetupId);

    @Query("""
            SELECT m
            FROM CourseMeetup m
            WHERE m.course.id = :courseId
              AND (:status IS NULL OR m.status = :status)
            ORDER BY m.startAt ASC, m.id ASC
            """)
    List<CourseMeetup> findByCourseIdAndOptionalStatus(
            @Param("courseId") Long courseId,
            @Param("status") CourseMeetupStatus status
    );
}
