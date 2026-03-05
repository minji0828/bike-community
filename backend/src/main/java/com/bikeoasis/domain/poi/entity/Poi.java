package com.bikeoasis.domain.poi.entity;

import com.bikeoasis.domain.poi.enums.PoiCategory;
import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * POI(Point of Interest) 엔티티
 */
@Entity
@Table(name = "pois")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Poi {


        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        private String name;

        /**
         * [이유]: PostGIS의 Point 타입을 사용하여 공간 인덱싱(GiST)을 활용합니다.
         * SRID 4326은 GPS 위경도 표준 좌표계입니다.
         */
        @Column(columnDefinition = "geometry(Point, 4326)")
        private Point location;

        private String address;

        @JdbcTypeCode(SqlTypes.JSON)
        private Map<String, Object> metadata; // 화장실 개방시간 등 유연한 데이터 저장

        @Enumerated(EnumType.STRING)
        @Column(name = "category_id")
        private PoiCategory categoryId;

        @Column(name = "external_id", unique = true, nullable = true)
        private String externalId; // 외부 API ID (증분 동기화 추적용)

        @Column(name = "last_synced_at")
        private LocalDateTime lastSyncedAt; // 마지막 동기화 시간

        @Column(name = "created_at", updatable = false)
        private LocalDateTime createdAt;

        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        @PrePersist
        protected void onCreate() {
            createdAt = LocalDateTime.now();
            updatedAt = LocalDateTime.now();
            lastSyncedAt = LocalDateTime.now();
        }

        @PreUpdate
        protected void onUpdate() {
            updatedAt = LocalDateTime.now();
            lastSyncedAt = LocalDateTime.now();
        }
    }


