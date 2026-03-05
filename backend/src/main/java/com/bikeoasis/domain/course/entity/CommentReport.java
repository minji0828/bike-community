package com.bikeoasis.domain.course.entity;

import com.bikeoasis.domain.course.enums.CommentReportStatus;
import com.bikeoasis.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "comment_reports",
        uniqueConstraints = {
                @UniqueConstraint(name = "ux_comment_reports_comment_reporter", columnNames = {"comment_id", "reporter_user_id"})
        },
        indexes = {
         @Index(name = "idx_comment_reports_comment_id", columnList = "comment_id"),
         @Index(name = "idx_comment_reports_status_created_at", columnList = "status,created_at DESC")
        })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CommentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private CourseComment comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_user_id", nullable = false)
    private User reporterUser;

    @Column(nullable = false)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommentReportStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = CommentReportStatus.OPEN;
        }
    }
}
