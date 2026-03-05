package com.bikeoasis.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/**
 * 사용자 위치 엔티티 - 실시간 위치 추적
 */
@Entity
@Table(name = "user_locations", indexes = {
        @Index(name = "idx_user_id_created_at", columnList = "user_id,created_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * PostGIS Point 타입으로 위도, 경도 저장
     * SRID 4326은 GPS 위경도 표준 좌표계
     */
    @Column(columnDefinition = "geometry(Point, 4326)", nullable = false)
    private Point location;

    /**
     * 정확도 (미터 단위)
     */
    @Column(name = "accuracy")
    private Double accuracy;

    /**
     * 속도 (m/s)
     */
    @Column(name = "speed")
    private Double speed;

    /**
     * 고도 (미터)
     */
    @Column(name = "altitude")
    private Double altitude;

    /**
     * 추가 메타데이터 (기기 정보, 네트워크 타입 등)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    private java.util.Map<String, Object> metadata;

    /**
     * 위치 생성 시간
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 현재 위치 여부
     */
    @Column(name = "is_current", nullable = false)
    private Boolean isCurrent;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isCurrent == null) {
            this.isCurrent = false;
        }
    }

    /**
     * 위도 반환
     */
    public Double getLatitude() {
        return location != null ? location.getY() : null;
    }

    /**
     * 경도 반환
     */
    public Double getLongitude() {
        return location != null ? location.getX() : null;
    }
}

