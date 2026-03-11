package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.CourseCreateRequest;
import com.bikeoasis.domain.course.dto.CourseDetailResponse;
import com.bikeoasis.domain.course.dto.CourseFeaturedResponse;
import com.bikeoasis.domain.course.dto.CourseFromRidingCreateRequest;
import com.bikeoasis.domain.course.dto.CourseGpxCreateRequest;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.CourseTag;
import com.bikeoasis.domain.course.entity.CourseTagId;
import com.bikeoasis.domain.course.entity.CourseWarning;
import com.bikeoasis.domain.course.entity.Tag;
import com.bikeoasis.domain.course.enums.CourseSourceType;
import com.bikeoasis.domain.course.enums.CourseVerifiedStatus;
import com.bikeoasis.domain.course.enums.CourseVisibility;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.domain.course.repository.CourseTagRepository;
import com.bikeoasis.domain.course.repository.CourseWarningRepository;
import com.bikeoasis.domain.course.repository.TagRepository;
import com.bikeoasis.domain.course.service.gpx.CourseGpxStorage;
import com.bikeoasis.domain.riding.entity.Riding;
import com.bikeoasis.domain.riding.repository.RidingRepository;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 코스 관련 비즈니스 로직을 담당하는 서비스다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseService {

    private static final int SRID_WGS84 = 4326;
    private static final double LOOP_THRESHOLD_KM = 0.1;
    private static final double DEFAULT_AVG_SPEED_KMH = 15.0;
    private static final int MAX_GPX_XML_CHARS = 5_000_000;
    private static final int MAX_GPX_TRACK_POINTS = 20_000;

    private final CourseRepository courseRepository;
    private final TagRepository tagRepository;
    private final CourseTagRepository courseTagRepository;
    private final CourseWarningRepository courseWarningRepository;
    private final GeometryFactory geometryFactory;
    private final RidingRepository ridingRepository;
    private final CourseGpxStorage courseGpxStorage;

    @Transactional
    public Long createCourse(CourseCreateRequest request, Long requesterUserId) {
        // CRS-P-001, CRS-P-002: 코스 생성은 인증 사용자만 가능하며 소유권은 JWT sub로 확정한다.
        Long resolvedRequesterUserId = requireRequesterUserId(requesterUserId);
        // CRS-P-006: path는 최소 2개 좌표가 필요하다.
        validateCreateRequest(request);

        LineString lineString = toLineString(request.getPath());
        Bbox bbox = computeBbox(lineString.getCoordinates());
        double distanceKm = computeDistanceKm(lineString.getCoordinates());
        boolean loop = computeLoop(lineString.getCoordinates());
        int estimatedDurationMin = (int) Math.max(1, Math.round((distanceKm / DEFAULT_AVG_SPEED_KMH) * 60.0));

        // CRS-P-004, CRS-P-005, CRS-P-007: sourceType 기본값과 verified 상태, 파생 메타데이터는 서버가 결정한다.
        CourseSourceType sourceType = parseSourceType(request.getSourceType());

        Course course = Course.builder()
                .ownerUserId(resolvedRequesterUserId)
                .deviceUuid(request.getDeviceUuid())
                .title(request.getTitle())
                .description(request.getDescription())
                .visibility(parseVisibility(request.getVisibility()))
                .sourceType(sourceType)
                .verifiedStatus(sourceType == CourseSourceType.CURATED ? CourseVerifiedStatus.CURATED : CourseVerifiedStatus.UNVERIFIED)
                .path(lineString)
                .distanceKm(distanceKm)
                .estimatedDurationMin(estimatedDurationMin)
                .loop(loop)
                .bboxMinLon(bbox.minLon)
                .bboxMinLat(bbox.minLat)
                .bboxMaxLon(bbox.maxLon)
                .bboxMaxLat(bbox.maxLat)
                .build();

        Course saved = courseRepository.save(course);
        String gpxXml = buildGpxFromCoordinates(request.getTitle(), lineString.getCoordinates());
        courseGpxStorage.store(saved, gpxXml);
        // CRS-P-008, CRS-P-009: 태그 정규화와 경고 저장은 코스 생성 플로우 안에서 함께 처리한다.
        saveTags(saved, request.getTags());
        saveWarnings(saved, request.getWarnings());
        return saved.getId();
    }

    @Transactional
    public Long createCourseFromGpx(CourseGpxCreateRequest request, Long requesterUserId) {
        // CRS-P-001, CRS-P-002: GPX 업로드 코스 생성도 인증 사용자 소유로만 허용한다.
        Long resolvedRequesterUserId = requireRequesterUserId(requesterUserId);
        if (request == null || request.getGpxXml() == null || request.getGpxXml().isBlank()) {
            throw new BusinessException(400, "gpxXml은 필수입니다.");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BusinessException(400, "title은 필수입니다.");
        }
        validateGpxXml(request.getGpxXml());

        List<Coordinate> coordinateList = parseCoordinatesFromGpx(request.getGpxXml());
        if (coordinateList.size() < 2) {
            throw new BusinessException(400, "GPX에는 최소 2개 trkpt가 필요합니다.");
        }

        Coordinate[] coordinates = coordinateList.toArray(Coordinate[]::new);
        LineString lineString = geometryFactory.createLineString(coordinates);
        lineString.setSRID(SRID_WGS84);
        Bbox bbox = computeBbox(coordinates);
        double distanceKm = computeDistanceKm(coordinates);
        boolean loop = computeLoop(coordinates);
        int estimatedDurationMin = (int) Math.max(1, Math.round((distanceKm / DEFAULT_AVG_SPEED_KMH) * 60.0));

        CourseSourceType sourceType = parseSourceType(request.getSourceType());
        Course course = Course.builder()
                .ownerUserId(resolvedRequesterUserId)
                .deviceUuid(request.getDeviceUuid())
                .title(request.getTitle())
                .description(request.getDescription())
                .visibility(parseVisibility(request.getVisibility()))
                .sourceType(sourceType)
                .verifiedStatus(sourceType == CourseSourceType.CURATED ? CourseVerifiedStatus.CURATED : CourseVerifiedStatus.UNVERIFIED)
                .path(lineString)
                .distanceKm(distanceKm)
                .estimatedDurationMin(estimatedDurationMin)
                .loop(loop)
                .bboxMinLon(bbox.minLon)
                .bboxMinLat(bbox.minLat)
                .bboxMaxLon(bbox.maxLon)
                .bboxMaxLat(bbox.maxLat)
                .build();
        Course saved = courseRepository.save(course);
        courseGpxStorage.store(saved, request.getGpxXml());
        return saved.getId();
    }

    @Transactional
    public Long createCourseFromRiding(CourseFromRidingCreateRequest request, Long requesterUserId) {
        // CRS-P-010, CRS-P-011: 라이딩 기반 코스 생성은 본인 라이딩에서만 가능하다.
        Long resolvedRequesterUserId = requireRequesterUserId(requesterUserId);
        if (request == null) {
            throw new BusinessException(400, "요청 본문이 필요합니다.");
        }
        if (request.getRidingId() == null) {
            throw new BusinessException(400, "ridingId는 필수입니다.");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BusinessException(400, "title은 필수입니다.");
        }

        Riding riding = ridingRepository.findById(request.getRidingId())
                .orElseThrow(() -> new BusinessException(404, "라이딩을 찾을 수 없습니다."));

        if (riding.getUserId() == null || !riding.getUserId().equals(resolvedRequesterUserId)) {
            throw new BusinessException(403, "라이딩 소유자만 코스를 생성할 수 있습니다.");
        }

        // CRS-P-012: 원본 라이딩 path 품질이 부족하면 코스 생성은 실패한다.
        if (riding.getPathData() == null || riding.getPathData().getCoordinates() == null || riding.getPathData().getCoordinates().length < 2) {
            throw new BusinessException(400, "라이딩 경로 데이터가 부족합니다.");
        }

        Coordinate[] coordinates = riding.getPathData().getCoordinates();
        LineString lineString = geometryFactory.createLineString(coordinates);
        lineString.setSRID(SRID_WGS84);
        Bbox bbox = computeBbox(coordinates);
        double distanceKm = computeDistanceKm(coordinates);
        boolean loop = computeLoop(coordinates);
        int estimatedDurationMin = (int) Math.max(1, Math.round((distanceKm / DEFAULT_AVG_SPEED_KMH) * 60.0));

        CourseSourceType sourceType = parseSourceType(request.getSourceType());
        // CRS-P-013: description 미입력 시 notes를 설명 대체값으로 사용한다.
        String description = (request.getDescription() != null && !request.getDescription().isBlank())
                ? request.getDescription()
                : request.getNotes();

        Course course = Course.builder()
                .ownerUserId(resolvedRequesterUserId)
                .deviceUuid(riding.getDeviceUuid())
                .title(request.getTitle())
                .description(description)
                .visibility(parseVisibility(request.getVisibility()))
                .sourceType(sourceType)
                .verifiedStatus(sourceType == CourseSourceType.CURATED ? CourseVerifiedStatus.CURATED : CourseVerifiedStatus.UNVERIFIED)
                .path(lineString)
                .distanceKm(distanceKm)
                .estimatedDurationMin(estimatedDurationMin)
                .loop(loop)
                .bboxMinLon(bbox.minLon)
                .bboxMinLat(bbox.minLat)
                .bboxMaxLon(bbox.maxLon)
                .bboxMaxLat(bbox.maxLat)
                .build();

        Course saved = courseRepository.save(course);
        String gpxXml = buildGpxFromCoordinates(request.getTitle(), coordinates);
        courseGpxStorage.store(saved, gpxXml);
        saveTags(saved, request.getTags());
        saveWarnings(saved, request.getWarnings());
        return saved.getId();
    }

    public CourseDetailResponse getCourseDetail(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));

        List<String> tags = course.getCourseTags().stream()
                .map(courseTag -> courseTag.getTag().getKey())
                .collect(Collectors.toList());

        List<CourseDetailResponse.WarningResponse> warnings = courseWarningRepository.findByCourseId(course.getId()).stream()
                .map(w -> new CourseDetailResponse.WarningResponse(
                        w.getType(),
                        w.getSeverity(),
                        w.getAtLocation() == null ? null : w.getAtLocation().getY(),
                        w.getAtLocation() == null ? null : w.getAtLocation().getX(),
                        w.getRadiusM(),
                        w.getNote(),
                        w.getValidUntil() == null ? null : w.getValidUntil().toString()
                ))
                .collect(Collectors.toList());

        List<CourseDetailResponse.PointResponse> path = Arrays.stream(course.getPath().getCoordinates())
                .map(c -> new CourseDetailResponse.PointResponse(c.y, c.x))
                .collect(Collectors.toList());

        CourseDetailResponse.AmenitiesSummary amenitiesSummary = null;
        if (course.getToiletCount() != null || course.getCafeCount() != null) {
            amenitiesSummary = new CourseDetailResponse.AmenitiesSummary(course.getToiletCount(), course.getCafeCount());
        }

        return new CourseDetailResponse(
                course.getId(),
                course.getTitle(),
                course.getVisibility().name().toLowerCase(),
                course.getSourceType().name().toLowerCase(),
                course.getVerifiedStatus().name().toLowerCase(),
                course.getDistanceKm(),
                course.getEstimatedDurationMin(),
                course.getLoop(),
                amenitiesSummary,
                tags,
                warnings,
                path
        );
    }

    public List<CourseFeaturedResponse> getFeaturedCourses(String region) {
        // CRS-P-020, CRS-P-021: 피처드 목록은 featuredRank가 있는 코스만 공개 조회한다.
        List<Course> courses = courseRepository.findByFeaturedRankNotNullOrderByFeaturedRankAsc();
        return courses.stream()
                .map(course -> new CourseFeaturedResponse(
                        course.getId(),
                        course.getTitle(),
                        course.getDistanceKm(),
                        course.getEstimatedDurationMin(),
                        course.getLoop(),
                        course.getFeaturedRank(),
                        course.getCourseTags().stream().map(ct -> ct.getTag().getKey()).collect(Collectors.toList())
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public String issueShareId(Long courseId, Long requesterUserId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));

        // SHR-P-001, SHR-P-002: 공유 링크 발급은 인증된 소유자만 가능하다.
        if (requesterUserId == null) {
            throw new BusinessException(401, "인증이 필요합니다.");
        }

        if (course.getOwnerUserId() == null) {
            throw new BusinessException(403, "공유 링크 발급 권한이 없습니다.");
        }

        if (!course.getOwnerUserId().equals(requesterUserId)) {
            throw new BusinessException(403, "코스 소유자만 공유 링크를 발급할 수 있습니다.");
        }

        // SHR-P-003: 기존 shareId가 있으면 재사용하고, 없을 때만 새로 생성한다.
        if (course.getShareId() == null || course.getShareId().isBlank()) {
            course.setShareId(generateUniqueShareId());
        }
        return courseRepository.save(course).getShareId();
    }

    public CourseDetailResponse getPublicCourse(String shareId) {
        // SHR-P-004, SHR-P-005, SHR-P-006: public/unlisted만 공유 조회를 허용하고 나머지는 404로 통일한다.
        Course course = courseRepository.findByShareIdAndVisibilityIn(
                        shareId,
                        List.of(CourseVisibility.PUBLIC, CourseVisibility.UNLISTED)
                )
                .orElseThrow(() -> new BusinessException(404, "공유 코스를 찾을 수 없습니다."));
        return getCourseDetail(course.getId());
    }

    public String getCourseGpx(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));
        String stored = courseGpxStorage.load(course);
        return stored != null ? stored : buildGpxFromCoordinates(course.getTitle(), course.getPath().getCoordinates());
    }

    public String getPublicCourseGpx(String shareId) {
        // SHR-P-007: 공유 GPX 다운로드도 동일한 공개 범위 정책을 따른다.
        Course course = courseRepository.findByShareIdAndVisibilityIn(
                        shareId,
                        List.of(CourseVisibility.PUBLIC, CourseVisibility.UNLISTED)
                )
                .orElseThrow(() -> new BusinessException(404, "공유 코스를 찾을 수 없습니다."));
        String stored = courseGpxStorage.load(course);
        return stored != null ? stored : buildGpxFromCoordinates(course.getTitle(), course.getPath().getCoordinates());
    }

    @Transactional
    public void ensureSeedCourseFromGpx(String title, String gpxXml, Integer featuredRank) {
        if (title == null || title.isBlank() || gpxXml == null || gpxXml.isBlank()) {
            return;
        }
        validateGpxXml(gpxXml);
        if (courseRepository.existsByTitle(title)) {
            return;
        }

        List<Coordinate> coordinateList = parseCoordinatesFromGpx(gpxXml);
        if (coordinateList.size() < 2) {
            return;
        }

        Coordinate[] coordinates = coordinateList.toArray(Coordinate[]::new);
        LineString lineString = geometryFactory.createLineString(coordinates);
        lineString.setSRID(SRID_WGS84);
        Bbox bbox = computeBbox(coordinates);
        double distanceKm = computeDistanceKm(coordinates);
        boolean loop = computeLoop(coordinates);
        int estimatedDurationMin = (int) Math.max(1, Math.round((distanceKm / DEFAULT_AVG_SPEED_KMH) * 60.0));

        Course seed = Course.builder()
                .title(title)
                .visibility(CourseVisibility.PUBLIC)
                .sourceType(CourseSourceType.CURATED)
                .verifiedStatus(CourseVerifiedStatus.CURATED)
                .path(lineString)
                .distanceKm(distanceKm)
                .estimatedDurationMin(estimatedDurationMin)
                .loop(loop)
                .bboxMinLon(bbox.minLon)
                .bboxMinLat(bbox.minLat)
                .bboxMaxLon(bbox.maxLon)
                .bboxMaxLat(bbox.maxLat)
                .featuredRank(featuredRank)
                .build();

        Course saved = courseRepository.save(seed);
        courseGpxStorage.store(saved, gpxXml);
    }

    private void validateCreateRequest(CourseCreateRequest request) {
        if (request == null) {
            throw new BusinessException(400, "요청 본문이 필요합니다.");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BusinessException(400, "title은 필수입니다.");
        }
        if (request.getPath() == null || request.getPath().size() < 2) {
            throw new BusinessException(400, "path는 최소 2개 좌표가 필요합니다.");
        }
    }

    private Long requireRequesterUserId(Long requesterUserId) {
        if (requesterUserId == null) {
            throw new BusinessException(401, "인증이 필요합니다.");
        }
        return requesterUserId;
    }

    private LineString toLineString(List<CourseCreateRequest.PointDto> points) {
        Coordinate[] coordinates = points.stream()
                .map(p -> new Coordinate(p.getLon(), p.getLat()))
                .toArray(Coordinate[]::new);
        LineString lineString = geometryFactory.createLineString(coordinates);
        lineString.setSRID(SRID_WGS84);
        return lineString;
    }

    private CourseVisibility parseVisibility(String value) {
        if (value == null || value.isBlank()) {
            return CourseVisibility.PRIVATE;
        }
        try {
            return CourseVisibility.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(400, "visibility 값이 올바르지 않습니다.");
        }
    }

    private CourseSourceType parseSourceType(String value) {
        if (value == null || value.isBlank()) {
            return CourseSourceType.UGC;
        }
        if ("RIDING".equalsIgnoreCase(value)) {
            return CourseSourceType.UGC;
        }
        try {
            return CourseSourceType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(400, "sourceType 값이 올바르지 않습니다.");
        }
    }

    private void saveTags(Course course, List<String> tagKeys) {
        // CRS-P-008: 태그는 trim/lowercase/distinct로 정규화한 뒤 저장한다.
        if (tagKeys == null || tagKeys.isEmpty()) {
            return;
        }

        List<String> normalized = tagKeys.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(String::toLowerCase)
                .distinct()
                .collect(Collectors.toList());

        if (normalized.isEmpty()) {
            return;
        }

        Map<String, Tag> existingMap = tagRepository.findByKeyIn(normalized).stream()
                .collect(Collectors.toMap(Tag::getKey, t -> t));

        List<Tag> toCreate = normalized.stream()
                .filter(key -> !existingMap.containsKey(key))
                .map(key -> Tag.builder().key(key).label(key).category("general").isActive(true).build())
                .collect(Collectors.toList());

        if (!toCreate.isEmpty()) {
            List<Tag> savedTags = tagRepository.saveAll(toCreate);
            savedTags.forEach(tag -> existingMap.put(tag.getKey(), tag));
        }

        List<CourseTag> courseTags = normalized.stream()
                .map(existingMap::get)
                .filter(Objects::nonNull)
                .map(tag -> CourseTag.builder()
                        .id(new CourseTagId(course.getId(), tag.getId()))
                        .course(course)
                        .tag(tag)
                        .build())
                .collect(Collectors.toList());

        if (!courseTags.isEmpty()) {
            courseTagRepository.saveAll(courseTags);
        }
    }

    private void saveWarnings(Course course, List<CourseCreateRequest.WarningDto> warnings) {
        if (warnings == null || warnings.isEmpty()) {
            return;
        }

        List<CourseWarning> entities = warnings.stream()
                .filter(w -> w.getType() != null && !w.getType().isBlank())
                .map(w -> CourseWarning.builder()
                        .course(course)
                        .type(w.getType())
                        .severity(w.getSeverity() == null ? 1 : w.getSeverity())
                        .atLocation(toPoint(w.getLat(), w.getLon()))
                        .radiusM(w.getRadiusM())
                        .note(w.getNote())
                        .validUntil(w.getValidUntil())
                        .build())
                .collect(Collectors.toList());

        if (!entities.isEmpty()) {
            courseWarningRepository.saveAll(entities);
        }
    }

    private Point toPoint(Double lat, Double lon) {
        if (lat == null || lon == null) {
            return null;
        }
        Point point = geometryFactory.createPoint(new Coordinate(lon, lat));
        point.setSRID(SRID_WGS84);
        return point;
    }

    private String generateUniqueShareId() {
        for (int i = 0; i < 10; i++) {
            String candidate = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            if (courseRepository.findByShareId(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new BusinessException(500, "공유 링크 생성에 실패했습니다.");
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

    private Bbox computeBbox(Coordinate[] coordinates) {
        double minLon = Double.POSITIVE_INFINITY;
        double minLat = Double.POSITIVE_INFINITY;
        double maxLon = Double.NEGATIVE_INFINITY;
        double maxLat = Double.NEGATIVE_INFINITY;

        for (Coordinate coordinate : coordinates) {
            minLon = Math.min(minLon, coordinate.x);
            minLat = Math.min(minLat, coordinate.y);
            maxLon = Math.max(maxLon, coordinate.x);
            maxLat = Math.max(maxLat, coordinate.y);
        }
        return new Bbox(minLon, minLat, maxLon, maxLat);
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

    private List<Coordinate> parseCoordinatesFromGpx(String gpxXml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setNamespaceAware(true);

            Document document = factory.newDocumentBuilder().parse(new InputSource(new StringReader(gpxXml)));
            NodeList trackPoints = document.getElementsByTagNameNS("*", "trkpt");
            if (trackPoints.getLength() > MAX_GPX_TRACK_POINTS) {
                throw new BusinessException(400, "GPX 경로 포인트가 너무 많습니다.");
            }

            List<Coordinate> coordinates = new java.util.ArrayList<>();
            for (int i = 0; i < trackPoints.getLength(); i++) {
                Element trkpt = (Element) trackPoints.item(i);
                String lat = trkpt.getAttribute("lat");
                String lon = trkpt.getAttribute("lon");
                if (lat == null || lat.isBlank() || lon == null || lon.isBlank()) {
                    continue;
                }
                coordinates.add(new Coordinate(Double.parseDouble(lon), Double.parseDouble(lat)));
            }
            return coordinates;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(400, "유효하지 않은 GPX 형식입니다.");
        }
    }

    private void validateGpxXml(String gpxXml) {
        if (gpxXml.length() > MAX_GPX_XML_CHARS) {
            throw new BusinessException(400, "GPX XML 크기가 너무 큽니다.");
        }
    }

    private String buildGpxFromCoordinates(String title, Coordinate[] coordinates) {
        String safeTitle = escapeXml(title == null ? "course" : title);
        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.append("<gpx version=\"1.1\" creator=\"bikeoasis\" xmlns=\"http://www.topografix.com/GPX/1/1\">");
        sb.append("<trk><name>").append(safeTitle).append("</name><trkseg>");
        for (Coordinate coordinate : coordinates) {
            sb.append("<trkpt lat=\"").append(coordinate.y).append("\" lon=\"").append(coordinate.x).append("\"/>");
        }
        sb.append("</trkseg></trk></gpx>");
        return sb.toString();
    }

    private String escapeXml(String input) {
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private record Bbox(double minLon, double minLat, double maxLon, double maxLat) {
    }
}
