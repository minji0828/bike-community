package com.bikeoasis.domain.user.repository;

import com.bikeoasis.domain.user.entity.User;
import com.bikeoasis.domain.user.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 사용자 저장소
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByProviderAndProviderSub(AuthProvider provider, String providerSub);

}

