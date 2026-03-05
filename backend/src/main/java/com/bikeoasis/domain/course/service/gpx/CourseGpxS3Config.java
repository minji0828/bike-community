package com.bikeoasis.domain.course.service.gpx;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Configuration
@ConditionalOnProperty(name = "course.gpx.storage.mode", havingValue = "s3")
public class CourseGpxS3Config {

    @Bean
    public S3Client courseGpxS3Client(CourseGpxS3Properties properties) {
        S3ClientBuilder builder = S3Client.builder();
        if (StringUtils.hasText(properties.getRegion())) {
            builder.region(Region.of(properties.getRegion()));
        }
        return builder.build();
    }
}
