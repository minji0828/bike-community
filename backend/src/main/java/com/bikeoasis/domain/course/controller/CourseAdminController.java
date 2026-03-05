package com.bikeoasis.domain.course.controller;

import com.bikeoasis.domain.course.dto.admin.CourseMetadataRecalculateResponse;
import com.bikeoasis.domain.course.dto.admin.CourseWarningAdminCreateRequest;
import com.bikeoasis.domain.course.dto.admin.CourseWarningAdminResponse;
import com.bikeoasis.domain.course.dto.admin.TagAdminResponse;
import com.bikeoasis.domain.course.dto.admin.TagAdminUpsertRequest;
import com.bikeoasis.domain.course.service.CourseAdminService;
import com.bikeoasis.global.admin.AdminKeyAuthService;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Course API", description = "(운영) 태그/경고/메타데이터 관리")
public class CourseAdminController {

    private final AdminKeyAuthService adminKeyAuthService;
    private final CourseAdminService courseAdminService;

    @GetMapping("/tags")
    @Operation(summary = "태그 사전 조회", description = "운영용 태그 사전을 조회합니다.")
    public ResponseEntity<ApiResponse<List<TagAdminResponse>>> listTags(
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        return ResponseEntity.ok(ApiResponse.success(courseAdminService.listTags()));
    }

    @PostMapping("/tags")
    @Operation(summary = "태그 생성", description = "운영용 태그를 생성합니다.")
    public ResponseEntity<ApiResponse<TagAdminResponse>> createTag(
            @RequestBody TagAdminUpsertRequest request,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        return ResponseEntity.ok(ApiResponse.success(courseAdminService.createTag(request)));
    }

    @PatchMapping("/tags/{tagId}")
    @Operation(summary = "태그 수정", description = "운영용 태그를 수정합니다.")
    public ResponseEntity<ApiResponse<TagAdminResponse>> updateTag(
            @PathVariable Long tagId,
            @RequestBody TagAdminUpsertRequest request,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        return ResponseEntity.ok(ApiResponse.success(courseAdminService.updateTag(tagId, request)));
    }

    @DeleteMapping("/tags/{tagId}")
    @Operation(summary = "태그 비활성화", description = "태그를 비활성화합니다.")
    public ResponseEntity<ApiResponse<String>> deactivateTag(
            @PathVariable Long tagId,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        courseAdminService.deactivateTag(tagId);
        return ResponseEntity.ok(ApiResponse.success("deactivated"));
    }

    @GetMapping("/courses/{courseId}/warnings")
    @Operation(summary = "코스 경고 조회", description = "코스의 경고 목록을 운영용으로 조회합니다.")
    public ResponseEntity<ApiResponse<List<CourseWarningAdminResponse>>> listWarnings(
            @PathVariable Long courseId,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        return ResponseEntity.ok(ApiResponse.success(courseAdminService.listWarnings(courseId)));
    }

    @PostMapping("/courses/{courseId}/warnings")
    @Operation(summary = "코스 경고 생성", description = "코스 경고를 추가합니다.")
    public ResponseEntity<ApiResponse<CourseWarningAdminResponse>> createWarning(
            @PathVariable Long courseId,
            @RequestBody CourseWarningAdminCreateRequest request,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        return ResponseEntity.ok(ApiResponse.success(courseAdminService.createWarning(courseId, request)));
    }

    @DeleteMapping("/warnings/{warningId}")
    @Operation(summary = "코스 경고 삭제", description = "코스 경고를 삭제합니다.")
    public ResponseEntity<ApiResponse<String>> deleteWarning(
            @PathVariable Long warningId,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        courseAdminService.deleteWarning(warningId);
        return ResponseEntity.ok(ApiResponse.success("deleted"));
    }

    @PostMapping("/courses/{courseId}/metadata/recalculate")
    @Operation(summary = "코스 메타데이터 재계산", description = "거리/예상시간/bbox/toiletCount를 재계산합니다.")
    public ResponseEntity<ApiResponse<CourseMetadataRecalculateResponse>> recalculateCourseMetadata(
            @PathVariable Long courseId,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        return ResponseEntity.ok(ApiResponse.success(courseAdminService.recalculateMetadata(courseId)));
    }
}
