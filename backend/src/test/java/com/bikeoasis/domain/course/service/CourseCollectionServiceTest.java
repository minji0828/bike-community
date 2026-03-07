package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.CourseCollectionAddItemRequest;
import com.bikeoasis.domain.course.dto.CourseCollectionCreateRequest;
import com.bikeoasis.domain.course.dto.CourseCollectionDetailResponse;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.CourseCollection;
import com.bikeoasis.domain.course.entity.CourseCollectionItem;
import com.bikeoasis.domain.course.enums.CourseCollectionVisibility;
import com.bikeoasis.domain.course.enums.CourseSourceType;
import com.bikeoasis.domain.course.enums.CourseVerifiedStatus;
import com.bikeoasis.domain.course.enums.CourseVisibility;
import com.bikeoasis.domain.course.repository.CourseCollectionItemRepository;
import com.bikeoasis.domain.course.repository.CourseCollectionRepository;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.global.error.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CourseCollectionServiceTest {

    @Mock
    private CourseCollectionRepository courseCollectionRepository;
    @Mock
    private CourseCollectionItemRepository courseCollectionItemRepository;
    @Mock
    private CourseRepository courseRepository;

    private CourseCollectionService courseCollectionService;

    @BeforeEach
    void setUp() {
        courseCollectionService = new CourseCollectionService(courseCollectionRepository, courseCollectionItemRepository, courseRepository);
    }

    @Test
    void createCollection_success() {
        given(courseCollectionRepository.save(any(CourseCollection.class))).willAnswer(invocation -> {
            CourseCollection collection = invocation.getArgument(0);
            collection.setId(11L);
            return collection;
        });

        Long collectionId = courseCollectionService.createCollection(7L,
                new CourseCollectionCreateRequest("주말 강원 라이딩", "설명", "강원", "1박 2일", "public"));

        assertThat(collectionId).isEqualTo(11L);
    }

    @Test
    void addCourseToCollection_failsWhenDuplicateCourse() {
        CourseCollection collection = collection(3L, 9L, CourseCollectionVisibility.PRIVATE);
        given(courseCollectionRepository.findById(3L)).willReturn(Optional.of(collection));
        given(courseRepository.findById(5L)).willReturn(Optional.of(course(5L, "동부5고개")));
        given(courseCollectionItemRepository.existsByCollectionIdAndCourseId(3L, 5L)).willReturn(true);

        assertThatThrownBy(() -> courseCollectionService.addCourseToCollection(3L, 9L, new CourseCollectionAddItemRequest(5L, null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("이미 컬렉션에 담긴 코스");
    }

    @Test
    void getCollectionDetail_returnsItemsForOwner() {
        CourseCollection collection = collection(2L, 9L, CourseCollectionVisibility.PRIVATE);
        given(courseCollectionRepository.findById(2L)).willReturn(Optional.of(collection));
        given(courseCollectionItemRepository.findByCollectionIdOrderByPositionIndexAscIdAsc(2L))
                .willReturn(List.of(CourseCollectionItem.builder()
                        .id(100L)
                        .collection(collection)
                        .course(course(5L, "북한강 여행 코스"))
                        .positionIndex(0)
                        .build()));

        CourseCollectionDetailResponse response = courseCollectionService.getCollectionDetail(2L, 9L);

        assertThat(response.mine()).isTrue();
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).courseTitle()).isEqualTo("북한강 여행 코스");
    }

    @Test
    void addCourseToCollection_appendsWhenPositionMissing() {
        CourseCollection collection = collection(4L, 9L, CourseCollectionVisibility.PUBLIC);
        given(courseCollectionRepository.findById(4L)).willReturn(Optional.of(collection));
        given(courseRepository.findById(7L)).willReturn(Optional.of(course(7L, "한강 야간 라이딩")));
        given(courseCollectionItemRepository.existsByCollectionIdAndCourseId(4L, 7L)).willReturn(false);
        given(courseCollectionItemRepository.findMaxPositionIndexByCollectionId(4L)).willReturn(2);

        courseCollectionService.addCourseToCollection(4L, 9L, new CourseCollectionAddItemRequest(7L, null));

        verify(courseCollectionItemRepository).save(any(CourseCollectionItem.class));
        verify(courseCollectionRepository).save(collection);
    }

    private CourseCollection collection(Long id, Long ownerUserId, CourseCollectionVisibility visibility) {
        return CourseCollection.builder()
                .id(id)
                .ownerUserId(ownerUserId)
                .title("컬렉션")
                .visibility(visibility)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private Course course(Long id, String title) {
        return Course.builder()
                .id(id)
                .title(title)
                .visibility(CourseVisibility.PUBLIC)
                .sourceType(CourseSourceType.CURATED)
                .verifiedStatus(CourseVerifiedStatus.CURATED)
                .distanceKm(12.3)
                .estimatedDurationMin(65)
                .loop(Boolean.FALSE)
                .build();
    }
}
