package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.enums.CourseVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 코스 관련 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseRepository extends JpaRepository<Course, Long> {
    boolean existsByTitle(String title);

    Optional<Course> findByShareId(String shareId);

    Optional<Course> findByShareIdAndVisibilityIn(String shareId, List<CourseVisibility> visibilities);

    List<Course> findByFeaturedRankNotNullOrderByFeaturedRankAsc();
}
