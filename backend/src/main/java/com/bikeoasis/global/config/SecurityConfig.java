package com.bikeoasis.global.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security 설정
 */

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           @Qualifier("jwtDecoder") JwtDecoder appJwtDecoder,
                                           ApiAuthenticationEntryPoint apiAuthenticationEntryPoint,
                                           ApiAccessDeniedHandler apiAccessDeniedHandler) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // 테스트를 위해 CSRF 비활성화
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/v1/courses/*/comments").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/courses/*/share").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/courses/*/meetups").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/comments/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/comments/*/reports").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/meetups/*/join").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/v1/meetups/*/leave").authenticated()
                        .requestMatchers("/ws-stomp/**").permitAll()
                        .requestMatchers("/api/v1/locations/nearby").permitAll()
                        .requestMatchers("/api/v1/locations/**").authenticated()
                        .anyRequest().permitAll() // 그 외 요청 허용
                );

        http.exceptionHandling(exceptionHandling -> exceptionHandling
                .authenticationEntryPoint(apiAuthenticationEntryPoint)
                .accessDeniedHandler(apiAccessDeniedHandler));

        http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(appJwtDecoder)));
        return http.build();
    }
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

