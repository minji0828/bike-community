package com.bikeoasis.domain.user.dto;

public record UserCreateRequest(
        String email,
        String password,
        String username
) {}
