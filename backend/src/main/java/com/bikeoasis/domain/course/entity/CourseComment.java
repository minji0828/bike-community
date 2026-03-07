package com.bikeoasis.domain.course.entity;

import com.bikeoasis.domain.course.enums.CourseCommentStatus;
import com.bikeoasis.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_comments", indexes = {
        @Index(name = "idx_course_comments_course_id_created_at", columnList = "course_id,created_at DESC"),
        @Index(name = "idx_course_comments_author_user_id_created_at", columnList = "author_user_id,created_at DESC"),
        @Index(name = "idx_course_comments_status", columnList = "status")
})
/**
 * 코스 댓글 관련 영속 상태를 표현하는 JPA 엔티티다.
 */
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CourseComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_user_id", nullable = false)
    private User authorUser;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseCommentStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (status == null) {
            status = CourseCommentStatus.VISIBLE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
