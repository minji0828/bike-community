package com.bikeoasis.domain.course.service.gpx;

import com.bikeoasis.domain.course.entity.Course;

public interface CourseGpxStorage {

    void store(Course course, String gpxXml);

    String load(Course course);
}
