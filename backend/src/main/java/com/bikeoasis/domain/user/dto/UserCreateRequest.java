package com.bikeoasis.domain.user.dto;

/**
 * 사용자 생성 요청을 전달하는 DTO다.
 */
public record UserCreateRequest(
        String email,
        String password,
        String username
) {}
