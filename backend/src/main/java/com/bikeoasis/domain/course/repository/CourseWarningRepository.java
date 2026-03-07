package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseWarning;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 코스 경고 관련 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseWarningRepository extends JpaRepository<CourseWarning, Long> {
    List<CourseWarning> findByCourseId(Long courseId);
}
