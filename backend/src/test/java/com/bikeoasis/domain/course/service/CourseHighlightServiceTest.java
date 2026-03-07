package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.CourseHighlightCreateRequest;
import com.bikeoasis.domain.course.dto.CourseHighlightResponse;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.CourseHighlight;
import com.bikeoasis.domain.course.enums.CourseHighlightType;
import com.bikeoasis.domain.course.enums.CourseHighlightVisibility;
import com.bikeoasis.domain.course.enums.CourseSourceType;
import com.bikeoasis.domain.course.enums.CourseVerifiedStatus;
import com.bikeoasis.domain.course.enums.CourseVisibility;
import com.bikeoasis.domain.course.repository.CourseHighlightRepository;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.global.error.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class CourseHighlightServiceTest {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @Mock
    private CourseHighlightRepository courseHighlightRepository;
    @Mock
    private CourseRepository courseRepository;

    private CourseHighlightService courseHighlightService;

    @BeforeEach
    void setUp() {
        courseHighlightService = new CourseHighlightService(courseHighlightRepository, courseRepository);
    }

    @Test
    void createHighlight_success() {
        Course course = course(1L, "동부5고개");
        given(courseRepository.findById(1L)).willReturn(Optional.of(course));
        given(courseHighlightRepository.save(any(CourseHighlight.class))).willAnswer(invocation -> {
            CourseHighlight highlight = invocation.getArgument(0);
            highlight.setId(21L);
            return highlight;
        });

        Long highlightId = courseHighlightService.createHighlight(1L, 9L,
                new CourseHighlightCreateRequest("viewpoint", "전망 좋음", "해질녘 사진 추천", 37.55, 127.33, "public"));

        assertThat(highlightId).isEqualTo(21L);
    }

    @Test
    void listHighlights_returnsPublicAndMinePrivate() {
        given(courseRepository.existsById(1L)).willReturn(true);
        given(courseHighlightRepository.findVisibleByCourseId(1L, 9L, CourseHighlightVisibility.PUBLIC))
                .willReturn(List.of(
                        highlight(1L, 1L, 9L, CourseHighlightVisibility.PRIVATE),
                        highlight(2L, 1L, 7L, CourseHighlightVisibility.PUBLIC)
                ));

        List<CourseHighlightResponse> response = courseHighlightService.listHighlights(1L, 9L);

        assertThat(response).hasSize(2);
        assertThat(response.get(0).mine()).isTrue();
    }

    @Test
    void createHighlight_failsWhenCoordinatesInvalid() {
        assertThatThrownBy(() -> courseHighlightService.createHighlight(1L, 9L,
                new CourseHighlightCreateRequest("danger", "", "주의", 100.0, 127.0, "public")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("좌표");
    }

    private Course course(Long id, String title) {
        return Course.builder()
                .id(id)
                .title(title)
                .visibility(CourseVisibility.PUBLIC)
                .sourceType(CourseSourceType.CURATED)
                .verifiedStatus(CourseVerifiedStatus.CURATED)
                .distanceKm(10.0)
                .estimatedDurationMin(60)
                .loop(Boolean.FALSE)
                .build();
    }

    private CourseHighlight highlight(Long id, Long courseId, Long authorUserId, CourseHighlightVisibility visibility) {
        return CourseHighlight.builder()
                .id(id)
                .course(course(courseId, "코스"))
                .authorUserId(authorUserId)
                .type(CourseHighlightType.NOTE)
                .title("메모")
                .note("휴식 추천")
                .visibility(visibility)
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(127.1, 37.5)))
                .hidden(Boolean.FALSE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
