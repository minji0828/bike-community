package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseWarning;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseWarningRepository extends JpaRepository<CourseWarning, Long> {
    List<CourseWarning> findByCourseId(Long courseId);
}
