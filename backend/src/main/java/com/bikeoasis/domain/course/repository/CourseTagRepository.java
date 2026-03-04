package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseTag;
import com.bikeoasis.domain.course.entity.CourseTagId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseTagRepository extends JpaRepository<CourseTag, CourseTagId> {
}
