package com.bikeoasis.domain.course.service.gpx;

import com.bikeoasis.domain.course.entity.Course;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * DB 코스 GPX 관련 저장소 전략을 표현하는 구현다.
 */
@Component
@ConditionalOnProperty(name = "course.gpx.storage.mode", havingValue = "db", matchIfMissing = true)
public class DbCourseGpxStorage implements CourseGpxStorage {

    @Override
    public void store(Course course, String gpxXml) {
        course.setGpxData(gpxXml);
        course.setGpxObjectKey(null);
    }

    @Override
    public String load(Course course) {
        return StringUtils.hasText(course.getGpxData()) ? course.getGpxData() : null;
    }
}
