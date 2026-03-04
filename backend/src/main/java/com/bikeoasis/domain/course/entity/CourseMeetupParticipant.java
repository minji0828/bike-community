package com.bikeoasis.domain.course.entity;

import com.bikeoasis.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_meetup_participants",
        uniqueConstraints = {
                @UniqueConstraint(name = "ux_course_meetup_participants_meetup_user", columnNames = {"meetup_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_course_meetup_participants_meetup", columnList = "meetup_id"),
                @Index(name = "idx_course_meetup_participants_user", columnList = "user_id")
        })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CourseMeetupParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meetup_id", nullable = false)
    private CourseMeetup meetup;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
    }
}
