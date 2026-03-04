package com.bikeoasis.domain.course.controller;

import com.bikeoasis.domain.course.dto.CourseMeetupCreateRequest;
import com.bikeoasis.domain.course.dto.CourseMeetupCreateResponse;
import com.bikeoasis.domain.course.dto.CourseMeetupResponse;
import com.bikeoasis.domain.course.service.CourseMeetupService;
import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Course Meetup API", description = "코스 모임")
public class CourseMeetupController {

    private final CourseMeetupService courseMeetupService;

    @PostMapping("/courses/{courseId}/meetups")
    @Operation(summary = "모임 생성", description = "코스 기반 모임을 생성합니다.")
    public ResponseEntity<ApiResponse<CourseMeetupCreateResponse>> createMeetup(
            @PathVariable Long courseId,
            @RequestBody CourseMeetupCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = requireUserId(jwt);
        Long meetupId = courseMeetupService.createMeetup(courseId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(new CourseMeetupCreateResponse(meetupId)));
    }

    @GetMapping("/courses/{courseId}/meetups")
    @Operation(summary = "모임 목록 조회", description = "코스 모임 목록을 조회합니다. status 기본값은 open입니다.")
    public ResponseEntity<ApiResponse<List<CourseMeetupResponse>>> listMeetups(
            @PathVariable Long courseId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = getUserId(jwt);
        List<CourseMeetupResponse> response = courseMeetupService.listMeetups(courseId, status, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/meetups/{meetupId}")
    @Operation(summary = "모임 상세 조회", description = "모임 상세를 조회합니다.")
    public ResponseEntity<ApiResponse<CourseMeetupResponse>> getMeetup(
            @PathVariable Long meetupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = getUserId(jwt);
        CourseMeetupResponse response = courseMeetupService.getMeetup(meetupId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/meetups/{meetupId}/join")
    @Operation(summary = "모임 참여", description = "모임 정원/상태를 확인하고 참여합니다.")
    public ResponseEntity<ApiResponse<String>> joinMeetup(
            @PathVariable Long meetupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = requireUserId(jwt);
        courseMeetupService.joinMeetup(meetupId, userId);
        return ResponseEntity.ok(ApiResponse.success("joined"));
    }

    @PostMapping("/meetups/{meetupId}/leave")
    @Operation(summary = "모임 탈퇴", description = "모임에서 탈퇴합니다.")
    public ResponseEntity<ApiResponse<String>> leaveMeetup(
            @PathVariable Long meetupId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long userId = requireUserId(jwt);
        courseMeetupService.leaveMeetup(meetupId, userId);
        return ResponseEntity.ok(ApiResponse.success("left"));
    }

    private Long getUserId(Jwt jwt) {
        if (jwt == null) {
            return null;
        }
        String sub = jwt.getSubject();
        if (sub == null || sub.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(sub);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Long requireUserId(Jwt jwt) {
        Long userId = getUserId(jwt);
        if (userId == null) {
            throw new BusinessException(401, "인증이 필요합니다.");
        }
        return userId;
    }
}
