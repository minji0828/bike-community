package com.bikeoasis.domain.course.entity;

import com.bikeoasis.domain.course.enums.CourseSourceType;
import com.bikeoasis.domain.course.enums.CourseVerifiedStatus;
import com.bikeoasis.domain.course.enums.CourseVisibility;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.LineString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ownerUserId;

    private String deviceUuid;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseVisibility visibility;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseSourceType sourceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseVerifiedStatus verifiedStatus;

    @Column(columnDefinition = "geometry(LineString, 4326)", nullable = false)
    private LineString path;

    @Column(columnDefinition = "TEXT")
    private String gpxData;

    @Column(nullable = false)
    private Double distanceKm;

    @Column(nullable = false)
    private Integer estimatedDurationMin;

    @Column(nullable = false)
    private Boolean loop;

    private Double bboxMinLon;
    private Double bboxMinLat;
    private Double bboxMaxLon;
    private Double bboxMaxLat;

    private Integer toiletCount;
    private Integer cafeCount;
    private Double toiletMaxGapKm;
    private Double toiletAvgGapKm;

    @Column(unique = true)
    private String shareId;

    private Integer featuredRank;

    private Long viewCount;

    private Long followCount;

    private LocalDateTime lastVerifiedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CourseTag> courseTags = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (viewCount == null) {
            viewCount = 0L;
        }
        if (followCount == null) {
            followCount = 0L;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
