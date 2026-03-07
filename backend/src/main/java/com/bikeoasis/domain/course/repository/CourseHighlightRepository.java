package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseHighlight;
import com.bikeoasis.domain.course.enums.CourseHighlightVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 코스 하이라이트 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseHighlightRepository extends JpaRepository<CourseHighlight, Long> {

    @Query("""
            select h
            from CourseHighlight h
            where h.course.id = :courseId
              and h.hidden = false
              and (h.visibility = :publicVisibility or (:requesterUserId is not null and h.authorUserId = :requesterUserId))
            order by h.createdAt desc
            """)
    List<CourseHighlight> findVisibleByCourseId(
            @Param("courseId") Long courseId,
            @Param("requesterUserId") Long requesterUserId,
            @Param("publicVisibility") CourseHighlightVisibility publicVisibility
    );
}
