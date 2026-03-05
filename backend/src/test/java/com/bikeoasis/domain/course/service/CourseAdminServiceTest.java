package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.admin.CourseMetadataRecalculateResponse;
import com.bikeoasis.domain.course.dto.admin.TagAdminResponse;
import com.bikeoasis.domain.course.dto.admin.TagAdminUpsertRequest;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.Tag;
import com.bikeoasis.domain.course.enums.CourseSourceType;
import com.bikeoasis.domain.course.enums.CourseVerifiedStatus;
import com.bikeoasis.domain.course.enums.CourseVisibility;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.domain.course.repository.CourseWarningRepository;
import com.bikeoasis.domain.course.repository.TagRepository;
import com.bikeoasis.domain.poi.entity.Poi;
import com.bikeoasis.domain.poi.repository.PoiRepository;
import com.bikeoasis.global.error.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class CourseAdminServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private CourseWarningRepository courseWarningRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private PoiRepository poiRepository;

    private CourseAdminService courseAdminService;
    private GeometryFactory geometryFactory;

    @BeforeEach
    void setUp() {
        geometryFactory = new GeometryFactory();
        courseAdminService = new CourseAdminService(
                courseRepository,
                courseWarningRepository,
                tagRepository,
                poiRepository,
                geometryFactory
        );
    }

    @Test
    void createTag_success() {
        TagAdminUpsertRequest request = new TagAdminUpsertRequest("River", "강변", "scenery", true);
        Tag saved = Tag.builder()
                .id(1L)
                .key("river")
                .label("강변")
                .category("scenery")
                .isActive(true)
                .build();

        given(tagRepository.findByKey("river")).willReturn(Optional.empty());
        given(tagRepository.save(any(Tag.class))).willReturn(saved);

        TagAdminResponse response = courseAdminService.createTag(request);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.key()).isEqualTo("river");
        assertThat(response.label()).isEqualTo("강변");
        assertThat(response.isActive()).isTrue();
    }

    @Test
    void createTag_fail_whenDuplicateKey() {
        TagAdminUpsertRequest request = new TagAdminUpsertRequest("river", "강변", "scenery", true);
        given(tagRepository.findByKey("river")).willReturn(Optional.of(new Tag()));

        assertThatThrownBy(() -> courseAdminService.createTag(request))
                .isInstanceOf(BusinessException.class)
                .hasMessage("이미 존재하는 tag key입니다.");
    }

    @Test
    void recalculateMetadata_updatesDistanceLoopAndToiletCount() {
        Long courseId = 101L;
        Coordinate[] coordinates = new Coordinate[]{
                new Coordinate(127.1000, 37.5000),
                new Coordinate(127.1010, 37.5010),
                new Coordinate(127.1020, 37.5020)
        };
        Course course = Course.builder()
                .id(courseId)
                .title("테스트 코스")
                .visibility(CourseVisibility.PUBLIC)
                .sourceType(CourseSourceType.CURATED)
                .verifiedStatus(CourseVerifiedStatus.CURATED)
                .path(geometryFactory.createLineString(coordinates))
                .distanceKm(0.0)
                .estimatedDurationMin(1)
                .loop(false)
                .build();

        given(courseRepository.findById(courseId)).willReturn(Optional.of(course));
        given(poiRepository.findToiletsAlongRoute(any(String.class), anyDouble()))
                .willReturn(List.of(new Poi(), new Poi(), new Poi()));
        given(courseRepository.save(any(Course.class))).willAnswer(invocation -> invocation.getArgument(0));

        CourseMetadataRecalculateResponse response = courseAdminService.recalculateMetadata(courseId);

        assertThat(response.courseId()).isEqualTo(courseId);
        assertThat(response.distanceKm()).isGreaterThan(0.0);
        assertThat(response.estimatedDurationMin()).isGreaterThan(0);
        assertThat(response.toiletCount()).isEqualTo(3);
        assertThat(response.bboxMinLon()).isEqualTo(127.1000);
        assertThat(response.bboxMaxLat()).isEqualTo(37.5020);
    }
}
