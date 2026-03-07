package com.bikeoasis.domain.course.controller;

import com.bikeoasis.domain.course.dto.CourseCollectionAddItemRequest;
import com.bikeoasis.domain.course.dto.CourseCollectionCreateRequest;
import com.bikeoasis.domain.course.dto.CourseCollectionCreateResponse;
import com.bikeoasis.domain.course.dto.CourseCollectionDetailResponse;
import com.bikeoasis.domain.course.dto.CourseCollectionSummaryResponse;
import com.bikeoasis.domain.course.service.CourseCollectionService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 여행 컬렉션 API 엔드포인트를 담당하는 컨트롤러다.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Course Collection API", description = "여행 컬렉션")
public class CourseCollectionController {

    private final CourseCollectionService courseCollectionService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @PostMapping("/collections")
    @Operation(summary = "컬렉션 생성", description = "여러 코스를 여행 계획 단위로 묶는 컬렉션을 생성합니다.")
    public ResponseEntity<ApiResponse<CourseCollectionCreateResponse>> createCollection(
            @RequestBody CourseCollectionCreateRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        Long collectionId = courseCollectionService.createCollection(authenticatedUserResolver.requireUserId(jwt), request);
        return ResponseEntity.ok(ApiResponse.success(new CourseCollectionCreateResponse(collectionId)));
    }

    @GetMapping("/collections")
    @Operation(summary = "컬렉션 목록 조회", description = "mine=true면 내 컬렉션, 아니면 공개 컬렉션 목록을 조회합니다.")
    public ResponseEntity<ApiResponse<List<CourseCollectionSummaryResponse>>> listCollections(
            @RequestParam(defaultValue = "false") boolean mine,
            @AuthenticationPrincipal Jwt jwt
    ) {
        List<CourseCollectionSummaryResponse> response = courseCollectionService.listCollections(mine, authenticatedUserResolver.getUserId(jwt));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/collections/{collectionId}")
    @Operation(summary = "컬렉션 상세 조회", description = "공개 범위 정책을 적용해 컬렉션 상세를 조회합니다.")
    public ResponseEntity<ApiResponse<CourseCollectionDetailResponse>> getCollection(
            @PathVariable Long collectionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        CourseCollectionDetailResponse response = courseCollectionService.getCollectionDetail(collectionId, authenticatedUserResolver.getUserId(jwt));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/collections/{collectionId}/items")
    @Operation(summary = "컬렉션에 코스 추가", description = "소유자만 컬렉션에 코스를 담을 수 있습니다.")
    public ResponseEntity<ApiResponse<String>> addCourseToCollection(
            @PathVariable Long collectionId,
            @RequestBody CourseCollectionAddItemRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        courseCollectionService.addCourseToCollection(collectionId, authenticatedUserResolver.requireUserId(jwt), request);
        return ResponseEntity.ok(ApiResponse.success("added"));
    }
}
