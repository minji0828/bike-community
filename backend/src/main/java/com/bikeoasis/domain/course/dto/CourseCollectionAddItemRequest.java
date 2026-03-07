package com.bikeoasis.domain.course.dto;

/**
 * 여행 컬렉션에 코스를 추가할 때 사용하는 요청 DTO다.
 */
public record CourseCollectionAddItemRequest(
        Long courseId,
        Integer positionIndex
) {
}
