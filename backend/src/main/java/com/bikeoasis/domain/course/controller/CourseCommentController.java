package com.bikeoasis.domain.course.controller;

import com.bikeoasis.domain.course.dto.CommentReportCreateRequest;
import com.bikeoasis.domain.course.dto.CommentReportCreateResponse;
import com.bikeoasis.domain.course.dto.CourseCommentCreateRequest;
import com.bikeoasis.domain.course.dto.CourseCommentCreateResponse;
import com.bikeoasis.domain.course.dto.CourseCommentResponse;
import com.bikeoasis.domain.course.entity.CourseComment;
import com.bikeoasis.domain.course.service.CourseCommentService;
import com.bikeoasis.global.auth.AuthenticatedUserResolver;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * 코스 댓글 관련 API 엔드포인트를 담당하는 컨트롤러다.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Course Comment API", description = "코스 댓글")
public class CourseCommentController {

    private final CourseCommentService courseCommentService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @PostMapping("/courses/{courseId}/comments")
    @Operation(summary = "댓글 작성", description = "코스에 댓글을 작성합니다. 작성자 표시는 항상 익명입니다.")
    public ResponseEntity<ApiResponse<CourseCommentCreateResponse>> createComment(
            @PathVariable Long courseId,
            @RequestBody CourseCommentCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = authenticatedUserResolver.requireUserId(jwt);
        Long commentId = courseCommentService.createComment(courseId, userId, request == null ? null : request.body());
        return ResponseEntity.ok(ApiResponse.success(new CourseCommentCreateResponse(commentId)));
    }

    @GetMapping("/courses/{courseId}/comments")
    @Operation(summary = "댓글 조회", description = "코스의 최신 댓글을 조회합니다.")
    public ResponseEntity<ApiResponse<List<CourseCommentResponse>>> listComments(
            @PathVariable Long courseId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long currentUserId = authenticatedUserResolver.getUserId(jwt);
        List<CourseComment> comments = courseCommentService.listComments(courseId, cursor, limit);
        List<CourseCommentResponse> response = comments.stream()
                .map(c -> new CourseCommentResponse(
                        c.getId(),
                        new CourseCommentResponse.Author("익명"),
                        c.getBody(),
                        toOffsetDateTime(c.getCreatedAt()),
                        currentUserId != null && c.getAuthorUser().getId().equals(currentUserId)
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private OffsetDateTime toOffsetDateTime(java.time.LocalDateTime localDateTime) {
        if (localDateTime == null) {
            return null;
        }
        return localDateTime.atZone(ZoneId.systemDefault()).toOffsetDateTime();
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "댓글 삭제", description = "작성자만 댓글을 삭제할 수 있습니다(soft delete).")
    public ResponseEntity<ApiResponse<String>> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = authenticatedUserResolver.requireUserId(jwt);
        courseCommentService.deleteComment(commentId, userId);
        return ResponseEntity.ok(ApiResponse.success("deleted"));
    }

    @PostMapping("/comments/{commentId}/reports")
    @Operation(summary = "댓글 신고", description = "스팸/유해 댓글을 신고합니다.")
    public ResponseEntity<ApiResponse<CommentReportCreateResponse>> reportComment(
            @PathVariable Long commentId,
            @RequestBody CommentReportCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = authenticatedUserResolver.requireUserId(jwt);
        Long reportId = courseCommentService.reportComment(commentId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(new CommentReportCreateResponse(reportId)));
    }
}
