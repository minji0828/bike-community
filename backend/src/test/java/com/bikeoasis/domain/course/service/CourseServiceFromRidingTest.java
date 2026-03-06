package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.CourseFromRidingCreateRequest;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.domain.course.repository.CourseTagRepository;
import com.bikeoasis.domain.course.repository.CourseWarningRepository;
import com.bikeoasis.domain.course.repository.TagRepository;
import com.bikeoasis.domain.course.service.gpx.CourseGpxStorage;
import com.bikeoasis.domain.riding.entity.Riding;
import com.bikeoasis.domain.riding.repository.RidingRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceFromRidingTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private CourseTagRepository courseTagRepository;

    @Mock
    private CourseWarningRepository courseWarningRepository;

    @Mock
    private RidingRepository ridingRepository;

    @Mock
    private CourseGpxStorage courseGpxStorage;

    private final GeometryFactory geometryFactory = new GeometryFactory();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private CourseService courseService;

    @BeforeEach
    void setUp() {
        courseService = new CourseService(
                courseRepository,
                tagRepository,
                courseTagRepository,
                courseWarningRepository,
                geometryFactory,
                ridingRepository,
                courseGpxStorage
        );
    }

    @Test
    void createCourseFromRiding_setsSrid4326OnCoursePath() throws Exception {
        LineString ridingPath = geometryFactory.createLineString(new Coordinate[]{
                new Coordinate(127.1, 37.1),
                new Coordinate(127.2, 37.2)
        });
        // simulate a common pitfall: SRID not set on input geometry
        Assertions.assertThat(ridingPath.getSRID()).isEqualTo(0);

        Riding riding = Riding.builder()
                .id(1L)
                .userId(10L)
                .deviceUuid("device-1")
                .title("ride")
                .pathData(ridingPath)
                .build();

        when(ridingRepository.findById(1L)).thenReturn(Optional.of(riding));

        ArgumentCaptor<Course> courseCaptor = ArgumentCaptor.forClass(Course.class);
        when(courseRepository.save(courseCaptor.capture())).thenAnswer(invocation -> {
            Course course = invocation.getArgument(0);
            course.setId(100L);
            return course;
        });

        // language=JSON
        String json = """
                { "ridingId": 1, "title": "코스화 테스트" }
                """;
        CourseFromRidingCreateRequest request = objectMapper.readValue(json, CourseFromRidingCreateRequest.class);

        Long courseId = courseService.createCourseFromRiding(request);

        Assertions.assertThat(courseId).isEqualTo(100L);

        Course saved = courseCaptor.getValue();
        Assertions.assertThat(saved.getPath()).isNotNull();
        Assertions.assertThat(saved.getPath().getSRID()).isEqualTo(4326);
        Assertions.assertThat(saved.getOwnerUserId()).isEqualTo(10L);
        Assertions.assertThat(saved.getDeviceUuid()).isEqualTo("device-1");

        verify(courseGpxStorage).store(eq(saved), any(String.class));
    }
}

