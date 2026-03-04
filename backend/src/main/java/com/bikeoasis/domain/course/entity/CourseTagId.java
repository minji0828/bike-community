package com.bikeoasis.domain.course.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

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
