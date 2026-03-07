package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseTag;
import com.bikeoasis.domain.course.entity.CourseTagId;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 코스 태그 관련 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseTagRepository extends JpaRepository<CourseTag, CourseTagId> {
}
