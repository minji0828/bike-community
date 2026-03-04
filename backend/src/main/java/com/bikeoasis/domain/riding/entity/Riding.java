package com.bikeoasis.domain.riding.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.LineString;
import java.time.LocalDateTime;

@Entity
@Table(name = "ridings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Riding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId; // 회원인 경우 연동 (Nullable)

    @Column(nullable = false)
    private String deviceUuid; // 비회원 식별용 기기 ID

    private String title;

    private Double totalDistance; // 총 주행 거리 (m)

    private Integer totalTime; // 총 소요 시간 (초)

    private Double avgSpeed; // 평균 속도 (km/h)

    /**
     * [이유]: PostGIS의 LineString을 사용하여 전체 주행 경로를 하나의 객체로 저장합니다.
     * SRID 4326은 GPS 표준 좌표계입니다.
     */
    @Column(columnDefinition = "geometry(LineString, 4326)")
    private LineString pathData;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.title == null) this.title = "새로운 라이딩";
    }
}