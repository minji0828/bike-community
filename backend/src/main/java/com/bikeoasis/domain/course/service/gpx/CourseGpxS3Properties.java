package com.bikeoasis.domain.course.service.gpx;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "course.gpx.s3")
public class CourseGpxS3Properties {

    private String bucket;
    private String prefix = "courses/gpx";
    private String region;
}
