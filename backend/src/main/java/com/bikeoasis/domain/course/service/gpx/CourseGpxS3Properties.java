package com.bikeoasis.domain.course.service.gpx;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 코스 GPX S3 관련 설정 프로퍼티를 바인딩하는 클래스다.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "course.gpx.s3")
public class CourseGpxS3Properties {

    private String bucket;
    private String prefix = "courses/gpx";
    private String region;
}
