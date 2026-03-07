package com.bikeoasis.domain.riding.repository;

import com.bikeoasis.domain.riding.entity.Riding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 라이딩 기록 저장소
 */

@Repository
public interface RidingRepository extends JpaRepository<Riding, Long> {

}

