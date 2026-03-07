package com.bikeoasis.global.config;

import org.locationtech.jts.geom.GeometryFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 애플리케이션 Beans 관련 애플리케이션 설정을 담당하는 클래스다.
 */
@Configuration
public class AppBeansConfig {

    @Bean
    public GeometryFactory geometryFactory() {
        return new GeometryFactory();
    }
}
