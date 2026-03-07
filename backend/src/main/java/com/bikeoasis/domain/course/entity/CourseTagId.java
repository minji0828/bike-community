package com.bikeoasis.domain.course.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

/**
 * 코스 태그 Id 관련 영속 상태를 표현하는 JPA 엔티티다.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class CourseTagId implements Serializable {

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "tag_id")
    private Long tagId;
}
