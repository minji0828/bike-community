package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 태그 관련 데이터 접근을 담당하는 리포지토리다.
 */
public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByKeyIn(Collection<String> keys);

    Optional<Tag> findByKey(String key);
}
