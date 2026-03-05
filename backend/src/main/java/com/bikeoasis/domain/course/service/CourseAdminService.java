package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.admin.CourseMetadataRecalculateResponse;
import com.bikeoasis.domain.course.dto.admin.CourseWarningAdminCreateRequest;
import com.bikeoasis.domain.course.dto.admin.CourseWarningAdminResponse;
import com.bikeoasis.domain.course.dto.admin.TagAdminResponse;
import com.bikeoasis.domain.course.dto.admin.TagAdminUpsertRequest;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.CourseWarning;
import com.bikeoasis.domain.course.entity.Tag;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.domain.course.repository.CourseWarningRepository;
import com.bikeoasis.domain.course.repository.TagRepository;
import com.bikeoasis.domain.poi.repository.PoiRepository;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseAdminService {

    private static final double DEFAULT_AMENITY_BUFFER_M = 50.0;
    private static final double LOOP_THRESHOLD_KM = 0.1;
    private static final double DEFAULT_AVG_SPEED_KMH = 15.0;

    private final CourseRepository courseRepository;
    private final CourseWarningRepository courseWarningRepository;
    private final TagRepository tagRepository;
    private final PoiRepository poiRepository;
    private final GeometryFactory geometryFactory;

    public List<TagAdminResponse> listTags() {
        return tagRepository.findAll().stream()
                .sorted((a, b) -> a.getKey().compareToIgnoreCase(b.getKey()))
                .map(this::toTagResponse)
                .toList();
    }

    @Transactional
    public TagAdminResponse createTag(TagAdminUpsertRequest request) {
        String key = normalizeTagKey(request);
        if (tagRepository.findByKey(key).isPresent()) {
            throw new BusinessException(409, "이미 존재하는 tag key입니다.");
        }

        Tag tag = Tag.builder()
                .key(key)
                .label(resolveLabel(request, key))
                .category(resolveCategory(request))
                .isActive(request != null && request.isActive() != null ? request.isActive() : true)
                .build();
        return toTagResponse(tagRepository.save(tag));
    }

    @Transactional
    public TagAdminResponse updateTag(Long tagId, TagAdminUpsertRequest request) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new BusinessException(404, "태그를 찾을 수 없습니다."));

        String key = normalizeTagKey(request);
        if (!tag.getKey().equals(key) && tagRepository.findByKey(key).isPresent()) {
            throw new BusinessException(409, "이미 존재하는 tag key입니다.");
        }

        tag.setKey(key);
        tag.setLabel(resolveLabel(request, key));
        tag.setCategory(resolveCategory(request));
        if (request != null && request.isActive() != null) {
            tag.setIsActive(request.isActive());
        }
        return toTagResponse(tagRepository.save(tag));
    }

    @Transactional
    public void deactivateTag(Long tagId) {
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new BusinessException(404, "태그를 찾을 수 없습니다."));
        tag.setIsActive(false);
        tagRepository.save(tag);
    }

    public List<CourseWarningAdminResponse> listWarnings(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new BusinessException(404, "코스를 찾을 수 없습니다.");
        }
        return courseWarningRepository.findByCourseId(courseId).stream()
                .map(this::toWarningResponse)
                .toList();
    }

    @Transactional
    public CourseWarningAdminResponse createWarning(Long courseId, CourseWarningAdminCreateRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));

        if (request == null || request.type() == null || request.type().isBlank()) {
            throw new BusinessException(400, "type은 필수입니다.");
        }

        int severity = request.severity() == null ? 1 : request.severity();
        if (severity < 1 || severity > 3) {
            throw new BusinessException(400, "severity는 1~3 범위여야 합니다.");
        }

        CourseWarning warning = CourseWarning.builder()
                .course(course)
                .type(request.type().trim())
                .severity(severity)
                .atLocation(toPoint(request.lat(), request.lon()))
                .radiusM(request.radiusM())
                .note(request.note() == null ? null : request.note().trim())
                .validUntil(request.validUntil())
                .build();
        return toWarningResponse(courseWarningRepository.save(warning));
    }

    @Transactional
    public void deleteWarning(Long warningId) {
        CourseWarning warning = courseWarningRepository.findById(warningId)
                .orElseThrow(() -> new BusinessException(404, "경고를 찾을 수 없습니다."));
        courseWarningRepository.delete(warning);
    }

    @Transactional
    public CourseMetadataRecalculateResponse recalculateMetadata(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));

        Coordinate[] coordinates = course.getPath().getCoordinates();
        Bbox bbox = computeBbox(coordinates);
        double distanceKm = computeDistanceKm(coordinates);
        boolean loop = computeLoop(coordinates);
        int estimatedDurationMin = (int) Math.max(1, Math.round((distanceKm / DEFAULT_AVG_SPEED_KMH) * 60.0));

        int toiletCount = poiRepository.findToiletsAlongRoute(course.getPath().toText(), DEFAULT_AMENITY_BUFFER_M).size();

        course.setDistanceKm(distanceKm);
        course.setLoop(loop);
        course.setEstimatedDurationMin(estimatedDurationMin);
        course.setBboxMinLon(bbox.minLon);
        course.setBboxMinLat(bbox.minLat);
        course.setBboxMaxLon(bbox.maxLon);
        course.setBboxMaxLat(bbox.maxLat);
        course.setToiletCount(toiletCount);
        Course saved = courseRepository.save(course);

        return new CourseMetadataRecalculateResponse(
                saved.getId(),
                saved.getDistanceKm(),
                saved.getEstimatedDurationMin(),
                saved.getLoop(),
                saved.getBboxMinLon(),
                saved.getBboxMinLat(),
                saved.getBboxMaxLon(),
                saved.getBboxMaxLat(),
                saved.getToiletCount()
        );
    }

    private TagAdminResponse toTagResponse(Tag tag) {
        return new TagAdminResponse(
                tag.getId(),
                tag.getKey(),
                tag.getLabel(),
                tag.getCategory(),
                Boolean.TRUE.equals(tag.getIsActive())
        );
    }

    private CourseWarningAdminResponse toWarningResponse(CourseWarning warning) {
        Point at = warning.getAtLocation();
        return new CourseWarningAdminResponse(
                warning.getId(),
                warning.getCourse().getId(),
                warning.getType(),
                warning.getSeverity(),
                at == null ? null : at.getY(),
                at == null ? null : at.getX(),
                warning.getRadiusM(),
                warning.getNote(),
                warning.getValidUntil()
        );
    }

    private String normalizeTagKey(TagAdminUpsertRequest request) {
        if (request == null || request.key() == null || request.key().isBlank()) {
            throw new BusinessException(400, "tag key는 필수입니다.");
        }
        return request.key().trim().toLowerCase(Locale.ROOT);
    }

    private String resolveLabel(TagAdminUpsertRequest request, String fallbackKey) {
        if (request == null || request.label() == null || request.label().isBlank()) {
            return fallbackKey;
        }
        return request.label().trim();
    }

    private String resolveCategory(TagAdminUpsertRequest request) {
        if (request == null || request.category() == null || request.category().isBlank()) {
            return "general";
        }
        return request.category().trim();
    }

    private Point toPoint(Double lat, Double lon) {
        if (lat == null && lon == null) {
            return null;
        }
        if (lat == null || lon == null) {
            throw new BusinessException(400, "lat/lon은 함께 전달해야 합니다.");
        }
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            throw new BusinessException(400, "lat/lon 범위가 올바르지 않습니다.");
        }
        return geometryFactory.createPoint(new Coordinate(lon, lat));
    }

    private Bbox computeBbox(Coordinate[] coordinates) {
        double minLon = Arrays.stream(coordinates).mapToDouble(c -> c.x).min().orElse(0.0);
        double minLat = Arrays.stream(coordinates).mapToDouble(c -> c.y).min().orElse(0.0);
        double maxLon = Arrays.stream(coordinates).mapToDouble(c -> c.x).max().orElse(0.0);
        double maxLat = Arrays.stream(coordinates).mapToDouble(c -> c.y).max().orElse(0.0);
        return new Bbox(minLon, minLat, maxLon, maxLat);
    }

    private double computeDistanceKm(Coordinate[] coordinates) {
        double km = 0.0;
        for (int i = 1; i < coordinates.length; i++) {
            km += haversineKm(coordinates[i - 1].y, coordinates[i - 1].x, coordinates[i].y, coordinates[i].x);
        }
        return Math.round(km * 100.0) / 100.0;
    }

    private boolean computeLoop(Coordinate[] coordinates) {
        if (coordinates.length < 2) {
            return false;
        }
        Coordinate first = coordinates[0];
        Coordinate last = coordinates[coordinates.length - 1];
        return haversineKm(first.y, first.x, last.y, last.x) <= LOOP_THRESHOLD_KM;
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return r * c;
    }

    private record Bbox(double minLon, double minLat, double maxLon, double maxLat) {
    }
}
