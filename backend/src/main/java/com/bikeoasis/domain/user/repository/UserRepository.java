package com.bikeoasis.domain.user.repository;

import com.bikeoasis.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 사용자 저장소
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

}

