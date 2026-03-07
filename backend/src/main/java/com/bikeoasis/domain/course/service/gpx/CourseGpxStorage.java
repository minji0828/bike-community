package com.bikeoasis.domain.course.service.gpx;

import com.bikeoasis.domain.course.entity.Course;

/**
 * 코스 GPX 관련 저장소 전략을 표현하는 인터페이스다.
 */
public interface CourseGpxStorage {

    void store(Course course, String gpxXml);

    String load(Course course);
}
