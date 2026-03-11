package com.bikeoasis.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web 관련 애플리케이션 설정을 담당하는 클래스다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String allowedOrigins;

    @Value("${app.cors.allowed-origin-patterns:}")
    private String allowedOriginPatterns;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(resolveAllowedOrigins())
                .allowedOriginPatterns(resolveAllowedOriginPatterns())
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    private String[] resolveAllowedOrigins() {
        String[] values = StringUtils.commaDelimitedListToStringArray(allowedOrigins);
        if (values.length == 0) {
            return new String[]{"http://localhost:3000"};
        }
        return java.util.Arrays.stream(values)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toArray(String[]::new);
    }

    private String[] resolveAllowedOriginPatterns() {
        String[] values = StringUtils.commaDelimitedListToStringArray(allowedOriginPatterns);
        return java.util.Arrays.stream(values)
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toArray(String[]::new);
    }
}
