package com.bikeoasis.domain.course.controller;

import com.bikeoasis.domain.course.dto.CourseHighlightCreateRequest;
import com.bikeoasis.domain.course.dto.CourseHighlightResponse;
import com.bikeoasis.domain.course.service.CourseHighlightService;
import com.bikeoasis.global.auth.AuthenticatedUserResolver;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 코스 하이라이트 API 엔드포인트를 담당하는 컨트롤러다.
 */
@RestController
@RequestMapping("/api/v1/courses/{courseId}/highlights")
@RequiredArgsConstructor
@Tag(name = "Course Highlight API", description = "코스 하이라이트")
public class CourseHighlightController {

    private final CourseHighlightService courseHighlightService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping
    @Operation(summary = "코스 하이라이트 조회", description = "공개 하이라이트와 내 private 하이라이트를 조회합니다.")
    public ResponseEntity<ApiResponse<List<CourseHighlightResponse>>> listHighlights(
            @PathVariable Long courseId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        List<CourseHighlightResponse> response = courseHighlightService.listHighlights(courseId, authenticatedUserResolver.getUserId(jwt));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "코스 하이라이트 생성", description = "로그인 사용자가 코스 위 포인트 메모를 생성합니다.")
    public ResponseEntity<ApiResponse<String>> createHighlight(
            @PathVariable Long courseId,
            @RequestBody CourseHighlightCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long highlightId = courseHighlightService.createHighlight(courseId, authenticatedUserResolver.requireUserId(jwt), request);
        return ResponseEntity.ok(ApiResponse.success(String.valueOf(highlightId)));
    }
}
