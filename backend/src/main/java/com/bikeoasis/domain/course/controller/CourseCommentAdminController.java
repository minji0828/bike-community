package com.bikeoasis.domain.course.controller;

import com.bikeoasis.domain.course.service.CourseCommentService;
import com.bikeoasis.global.admin.AdminKeyAuthService;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 코스 댓글 관리 관련 API 엔드포인트를 담당하는 컨트롤러다.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Comment API", description = "(운영) 댓글 모더레이션")
public class CourseCommentAdminController {

    private final AdminKeyAuthService adminKeyAuthService;
    private final CourseCommentService courseCommentService;

    @PatchMapping("/comments/{commentId}/hide")
    @Operation(summary = "댓글 숨김", description = "운영자가 댓글을 숨김 처리합니다.")
    public ResponseEntity<ApiResponse<String>> hideComment(
            @PathVariable Long commentId,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        courseCommentService.hideComment(commentId);
        return ResponseEntity.ok(ApiResponse.success("hidden"));
    }

    @PatchMapping("/comments/{commentId}/unhide")
    @Operation(summary = "댓글 숨김 해제", description = "운영자가 숨김 댓글을 다시 노출합니다.")
    public ResponseEntity<ApiResponse<String>> unhideComment(
            @PathVariable Long commentId,
            @RequestHeader(value = "X-Admin-Key", required = false) String adminKey
    ) {
        adminKeyAuthService.requireAdmin(adminKey);
        courseCommentService.unhideComment(commentId);
        return ResponseEntity.ok(ApiResponse.success("visible"));
    }
}
