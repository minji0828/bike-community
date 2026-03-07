package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseComment;
import com.bikeoasis.domain.course.enums.CourseCommentStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 코스 댓글 관련 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseCommentRepository extends JpaRepository<CourseComment, Long> {

    @Query("""
            SELECT c
            FROM CourseComment c
            WHERE c.course.id = :courseId
              AND c.status IN :statuses
              AND (:cursor IS NULL OR c.id < :cursor)
            ORDER BY c.id DESC
            """)
    List<CourseComment> findByCourseIdCursor(
            @Param("courseId") Long courseId,
            @Param("cursor") Long cursor,
            @Param("statuses") Collection<CourseCommentStatus> statuses,
            Pageable pageable
    );

    Optional<CourseComment> findByIdAndStatusIn(Long id, Collection<CourseCommentStatus> statuses);
}
