package com.bikeoasis.domain.course.controller;

import com.bikeoasis.domain.course.dto.CourseCreateRequest;
import com.bikeoasis.domain.course.dto.CourseCreateResponse;
import com.bikeoasis.domain.course.dto.CourseDetailResponse;
import com.bikeoasis.domain.course.dto.CourseFeaturedResponse;
import com.bikeoasis.domain.course.dto.CourseFromRidingCreateRequest;
import com.bikeoasis.domain.course.dto.CourseGpxCreateRequest;
import com.bikeoasis.domain.course.dto.CourseShareResponse;
import com.bikeoasis.domain.course.service.CourseService;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @Operation(summary = "코스 생성", description = "경로 업로드 기반 코스를 생성합니다.")
    public ResponseEntity<ApiResponse<CourseCreateResponse>> createCourse(@RequestBody CourseCreateRequest request) {
        Long courseId = courseService.createCourse(request);
        return ResponseEntity.ok(ApiResponse.success(new CourseCreateResponse(courseId)));
    }

    @PostMapping("/from-riding")
    @Operation(summary = "코스 생성(라이딩 기반)", description = "라이딩 기록(ridingId)으로 코스를 생성합니다.")
    public ResponseEntity<ApiResponse<CourseCreateResponse>> createCourseFromRiding(
            @RequestBody CourseFromRidingCreateRequest request
    ) {
        Long courseId = courseService.createCourseFromRiding(request);
        return ResponseEntity.ok(ApiResponse.success(new CourseCreateResponse(courseId)));
    }

    @PostMapping("/gpx")
    @Operation(summary = "GPX 코스 생성", description = "GPX XML 기반 코스를 생성합니다.")
    public ResponseEntity<ApiResponse<CourseCreateResponse>> createCourseFromGpx(@RequestBody CourseGpxCreateRequest request) {
        Long courseId = courseService.createCourseFromGpx(request);
        return ResponseEntity.ok(ApiResponse.success(new CourseCreateResponse(courseId)));
    }

    @GetMapping("/{courseId}")
    @Operation(summary = "코스 상세 조회", description = "코스 메타데이터/경고/경로를 조회합니다.")
    public ResponseEntity<ApiResponse<CourseDetailResponse>> getCourse(@PathVariable Long courseId) {
        CourseDetailResponse response = courseService.getCourseDetail(courseId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(value = "/{courseId}/gpx", produces = "application/gpx+xml")
    @Operation(summary = "코스 GPX 조회", description = "코스의 GPX 원본(XML)을 반환합니다.")
    public ResponseEntity<String> getCourseGpx(@PathVariable Long courseId) {
        String gpx = courseService.getCourseGpx(courseId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/gpx+xml; charset=UTF-8")
                .body(gpx);
    }

    @GetMapping("/featured")
    @Operation(summary = "피처드 코스 조회", description = "featuredRank 기준 기본 코스 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<CourseFeaturedResponse>>> getFeaturedCourses(
            @RequestParam(required = false) String region
    ) {
        List<CourseFeaturedResponse> result = courseService.getFeaturedCourses(region);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{courseId}/share")
    @Operation(summary = "코스 공유 링크 발급", description = "코스 공유용 shareId를 생성합니다.")
    public ResponseEntity<ApiResponse<CourseShareResponse>> issueShare(@PathVariable Long courseId) {
        String shareId = courseService.issueShareId(courseId);
        return ResponseEntity.ok(ApiResponse.success(new CourseShareResponse(shareId)));
    }

    @GetMapping("/public/{shareId}")
    @Operation(summary = "공유 코스 조회", description = "shareId로 public/unlisted 코스를 조회합니다.")
    public ResponseEntity<ApiResponse<CourseDetailResponse>> getPublicCourse(@PathVariable String shareId) {
        CourseDetailResponse response = courseService.getPublicCourse(shareId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping(value = "/public/{shareId}/gpx", produces = "application/gpx+xml")
    @Operation(summary = "공유 코스 GPX 조회", description = "shareId로 공유 코스 GPX(XML)을 반환합니다.")
    public ResponseEntity<String> getPublicCourseGpx(@PathVariable String shareId) {
        String gpx = courseService.getPublicCourseGpx(shareId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/gpx+xml; charset=UTF-8")
                .body(gpx);
    }
}
