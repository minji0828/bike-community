package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.CourseHighlightCreateRequest;
import com.bikeoasis.domain.course.dto.CourseHighlightResponse;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.CourseHighlight;
import com.bikeoasis.domain.course.enums.CourseHighlightType;
import com.bikeoasis.domain.course.enums.CourseHighlightVisibility;
import com.bikeoasis.domain.course.repository.CourseHighlightRepository;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 코스 하이라이트 조회/생성을 담당하는 서비스다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseHighlightService {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    private final CourseHighlightRepository courseHighlightRepository;
    private final CourseRepository courseRepository;

    public List<CourseHighlightResponse> listHighlights(Long courseId, Long requesterUserId) {
        if (!courseRepository.existsById(courseId)) {
            throw new BusinessException(404, "코스를 찾을 수 없습니다.");
        }

        // HLT-P-001, HLT-P-003: 공개 하이라이트와 작성자 본인 private 하이라이트만 함께 조회한다.
        return courseHighlightRepository.findVisibleByCourseId(courseId, requesterUserId, CourseHighlightVisibility.PUBLIC)
                .stream()
                .map(highlight -> toResponse(highlight, requesterUserId))
                .toList();
    }

    @Transactional
    public Long createHighlight(Long courseId, Long authorUserId, CourseHighlightCreateRequest request) {
        // HLT-P-002, HLT-P-004, HLT-P-005, HLT-P-006: 생성 인증, 필수값, 좌표 검증, 기본 공개범위를 적용한다.
        validateCreateRequest(request);

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));

        CourseHighlight highlight = CourseHighlight.builder()
                .course(course)
                .authorUserId(authorUserId)
                .type(parseType(request.type()))
                .title(normalizeText(request.title()))
                .note(normalizeText(request.note()))
                .visibility(parseVisibility(request.visibility()))
                .location(GEOMETRY_FACTORY.createPoint(new Coordinate(request.lon(), request.lat())))
                .build();
        highlight.getLocation().setSRID(4326);

        return courseHighlightRepository.save(highlight).getId();
    }

    private CourseHighlightResponse toResponse(CourseHighlight highlight, Long requesterUserId) {
        return new CourseHighlightResponse(
                highlight.getId(),
                highlight.getCourse().getId(),
                highlight.getType().name().toLowerCase(),
                highlight.getTitle(),
                highlight.getNote(),
                highlight.getVisibility().name().toLowerCase(),
                highlight.getLocation() == null ? null : highlight.getLocation().getY(),
                highlight.getLocation() == null ? null : highlight.getLocation().getX(),
                highlight.getAuthorUserId(),
                requesterUserId != null && requesterUserId.equals(highlight.getAuthorUserId()),
                highlight.getCreatedAt()
        );
    }

    private void validateCreateRequest(CourseHighlightCreateRequest request) {
        if (request == null) {
            throw new BusinessException(400, "요청 본문이 필요합니다.");
        }
        // HLT-P-004: type, 좌표, title 또는 note 중 하나는 반드시 필요하다.
        if (request.type() == null || request.type().isBlank()) {
            throw new BusinessException(400, "type은 필수입니다.");
        }
        if ((request.note() == null || request.note().isBlank()) && (request.title() == null || request.title().isBlank())) {
            throw new BusinessException(400, "title 또는 note 중 하나는 필요합니다.");
        }
        if (request.lat() == null || request.lon() == null) {
            throw new BusinessException(400, "lat/lon은 필수입니다.");
        }
        if (request.lat() < -90 || request.lat() > 90 || request.lon() < -180 || request.lon() > 180) {
            throw new BusinessException(400, "좌표 값이 올바르지 않습니다.");
        }
    }

    private String normalizeText(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }

    private CourseHighlightType parseType(String raw) {
        try {
            return CourseHighlightType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(400, "type 값이 올바르지 않습니다.");
        }
    }

    private CourseHighlightVisibility parseVisibility(String raw) {
        if (raw == null || raw.isBlank()) {
            return CourseHighlightVisibility.PUBLIC;
        }
        try {
            return CourseHighlightVisibility.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(400, "visibility 값이 올바르지 않습니다.");
        }
    }
}
