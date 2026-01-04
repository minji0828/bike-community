package com.bikeoasis.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger/OpenAPI 설정
 */
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("BikeOasis API")
                        .version("1.0.0")
                        .description("자전거 라이딩 관리 및 POI 정보 제공 API"))
                .addServersItem(new Server()
                        .url("http://localhost:8080")
                        .description("Local Server"));
    }
}

