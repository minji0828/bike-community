package com.bikeoasis.global.auth;

import com.bikeoasis.global.error.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.security.Principal;
import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthenticatedUserResolverTest {

    private final AuthenticatedUserResolver resolver = new AuthenticatedUserResolver();

    @Test
    void requireUserIdReturnsSubjectWhenJwtIsValid() {
        Jwt jwt = jwtWithSubject("42");

        Long userId = resolver.requireUserId(jwt);

        assertThat(userId).isEqualTo(42L);
    }

    @Test
    void getUserIdReturnsNullWhenJwtIsMissing() {
        assertThat(resolver.getUserId((Jwt) null)).isNull();
    }

    @Test
    void requireUserIdThrowsWhenJwtSubjectIsInvalid() {
        Jwt jwt = jwtWithSubject("not-a-number");

        assertThatThrownBy(() -> resolver.requireUserId(jwt))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("유효하지 않은 인증 토큰입니다.");
    }

    @Test
    void requireUserIdReadsPrincipalNameForWebSocket() {
        Principal principal = () -> "7";

        Long userId = resolver.requireUserId(principal);

        assertThat(userId).isEqualTo(7L);
    }

    @Test
    void getUserIdReturnsNullWhenPrincipalNameIsInvalid() {
        Principal principal = () -> "guest";

        assertThat(resolver.getUserId(principal)).isNull();
    }

    private Jwt jwtWithSubject(String subject) {
        return new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(300),
                Map.of("alg", "HS256"),
                Map.of("sub", subject)
        );
    }
}
