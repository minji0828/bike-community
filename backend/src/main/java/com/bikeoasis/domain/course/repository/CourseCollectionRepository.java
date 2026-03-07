package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseCollection;
import com.bikeoasis.domain.course.enums.CourseCollectionVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 여행 컬렉션 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseCollectionRepository extends JpaRepository<CourseCollection, Long> {

    List<CourseCollection> findByOwnerUserIdOrderByUpdatedAtDesc(Long ownerUserId);

    List<CourseCollection> findByVisibilityOrderByUpdatedAtDesc(CourseCollectionVisibility visibility);
}
