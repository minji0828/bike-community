package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.CourseCollectionAddItemRequest;
import com.bikeoasis.domain.course.dto.CourseCollectionDetailResponse;
import com.bikeoasis.domain.course.dto.CourseCollectionItemResponse;
import com.bikeoasis.domain.course.dto.CourseCollectionSummaryResponse;
import com.bikeoasis.domain.course.dto.CourseCollectionCreateRequest;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.CourseCollection;
import com.bikeoasis.domain.course.entity.CourseCollectionItem;
import com.bikeoasis.domain.course.enums.CourseCollectionVisibility;
import com.bikeoasis.domain.course.repository.CourseCollectionItemRepository;
import com.bikeoasis.domain.course.repository.CourseCollectionRepository;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 여행 컬렉션 생성/조회/코스 추가를 담당하는 서비스다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseCollectionService {

    private final CourseCollectionRepository courseCollectionRepository;
    private final CourseCollectionItemRepository courseCollectionItemRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public Long createCollection(Long ownerUserId, CourseCollectionCreateRequest request) {
        // COL-P-001, COL-P-002: 컬렉션 생성은 인증 사용자만 가능하고 visibility 기본값은 private다.
        validateCreateRequest(request);

        CourseCollection collection = CourseCollection.builder()
                .ownerUserId(ownerUserId)
                .title(request.title().trim())
                .description(normalizeText(request.description()))
                .region(normalizeText(request.region()))
                .tripNotes(normalizeText(request.tripNotes()))
                .visibility(parseVisibility(request.visibility()))
                .build();

        return courseCollectionRepository.save(collection).getId();
    }

    public List<CourseCollectionSummaryResponse> listCollections(boolean mine, Long requesterUserId) {
        List<CourseCollection> collections;
        if (mine) {
            // COL-P-003: mine 목록은 인증 사용자만 조회할 수 있다.
            if (requesterUserId == null) {
                throw new BusinessException(401, "인증이 필요합니다.");
            }
            collections = courseCollectionRepository.findByOwnerUserIdOrderByUpdatedAtDesc(requesterUserId);
        } else {
            // COL-P-004: 공개 목록은 public 컬렉션만 노출한다.
            collections = courseCollectionRepository.findByVisibilityOrderByUpdatedAtDesc(CourseCollectionVisibility.PUBLIC);
        }

        return collections.stream()
                .map(collection -> new CourseCollectionSummaryResponse(
                        collection.getId(),
                        collection.getTitle(),
                        collection.getRegion(),
                        collection.getVisibility().name().toLowerCase(),
                        collection.getItems() == null ? 0 : collection.getItems().size(),
                        collection.getUpdatedAt()
                ))
                .toList();
    }

    public CourseCollectionDetailResponse getCollectionDetail(Long collectionId, Long requesterUserId) {
        CourseCollection collection = courseCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new BusinessException(404, "컬렉션을 찾을 수 없습니다."));

        boolean mine = requesterUserId != null && requesterUserId.equals(collection.getOwnerUserId());
        // COL-P-005: 비소유자는 private 컬렉션 상세를 볼 수 없다.
        if (!mine && collection.getVisibility() == CourseCollectionVisibility.PRIVATE) {
            throw new BusinessException(403, "비공개 컬렉션입니다.");
        }

        List<CourseCollectionItemResponse> items = courseCollectionItemRepository.findByCollectionIdOrderByPositionIndexAscIdAsc(collectionId)
                .stream()
                .map(item -> new CourseCollectionItemResponse(
                        item.getId(),
                        item.getCourse().getId(),
                        item.getCourse().getTitle(),
                        item.getCourse().getDistanceKm(),
                        item.getCourse().getEstimatedDurationMin(),
                        item.getPositionIndex()
                ))
                .toList();

        return new CourseCollectionDetailResponse(
                collection.getId(),
                collection.getOwnerUserId(),
                collection.getTitle(),
                collection.getDescription(),
                collection.getRegion(),
                collection.getTripNotes(),
                collection.getVisibility().name().toLowerCase(),
                items.size(),
                items,
                collection.getCreatedAt(),
                collection.getUpdatedAt(),
                mine
        );
    }

    @Transactional
    public void addCourseToCollection(Long collectionId, Long ownerUserId, CourseCollectionAddItemRequest request) {
        if (request == null || request.courseId() == null) {
            throw new BusinessException(400, "courseId는 필수입니다.");
        }

        CourseCollection collection = courseCollectionRepository.findById(collectionId)
                .orElseThrow(() -> new BusinessException(404, "컬렉션을 찾을 수 없습니다."));
        // COL-P-006: 컬렉션 소유자만 코스를 추가할 수 있다.
        if (!ownerUserId.equals(collection.getOwnerUserId())) {
            throw new BusinessException(403, "컬렉션 소유자만 코스를 추가할 수 있습니다.");
        }

        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));

        // COL-P-007: 같은 컬렉션에는 같은 코스를 중복 추가할 수 없다.
        if (courseCollectionItemRepository.existsByCollectionIdAndCourseId(collectionId, request.courseId())) {
            throw new BusinessException(409, "이미 컬렉션에 담긴 코스입니다.");
        }

        Integer positionIndex = request.positionIndex();
        // COL-P-008: positionIndex가 없거나 음수면 맨 뒤 순번으로 자동 배치한다.
        if (positionIndex == null || positionIndex < 0) {
            Integer maxPosition = courseCollectionItemRepository.findMaxPositionIndexByCollectionId(collectionId);
            positionIndex = (maxPosition == null ? -1 : maxPosition) + 1;
        }

        courseCollectionItemRepository.save(CourseCollectionItem.builder()
                .collection(collection)
                .course(course)
                .positionIndex(positionIndex)
                .build());

        collection.setUpdatedAt(LocalDateTime.now());
        courseCollectionRepository.save(collection);
    }

    private void validateCreateRequest(CourseCollectionCreateRequest request) {
        if (request == null) {
            throw new BusinessException(400, "요청 본문이 필요합니다.");
        }
        if (request.title() == null || request.title().isBlank()) {
            throw new BusinessException(400, "title은 필수입니다.");
        }
        if (request.title().trim().length() > 120) {
            throw new BusinessException(400, "title은 120자 이하여야 합니다.");
        }
    }

    private String normalizeText(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return raw.trim();
    }

    private CourseCollectionVisibility parseVisibility(String raw) {
        if (raw == null || raw.isBlank()) {
            return CourseCollectionVisibility.PRIVATE;
        }
        try {
            return CourseCollectionVisibility.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(400, "visibility 값이 올바르지 않습니다.");
        }
    }
}
