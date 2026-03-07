package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CourseCollectionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * 여행 컬렉션 내부 코스 항목 데이터 접근을 담당하는 리포지토리다.
 */
public interface CourseCollectionItemRepository extends JpaRepository<CourseCollectionItem, Long> {

    boolean existsByCollectionIdAndCourseId(Long collectionId, Long courseId);

    List<CourseCollectionItem> findByCollectionIdOrderByPositionIndexAscIdAsc(Long collectionId);

    @Query("select coalesce(max(i.positionIndex), -1) from CourseCollectionItem i where i.collection.id = :collectionId")
    Integer findMaxPositionIndexByCollectionId(Long collectionId);
}
