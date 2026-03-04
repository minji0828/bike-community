package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByKeyIn(Collection<String> keys);

    Optional<Tag> findByKey(String key);
}
