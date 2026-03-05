package com.bikeoasis.domain.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 위치 조회 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationUpdateRequest {
    /**
     * 위도
     */
    @JsonProperty("latitude")
    private Double latitude;

    /**
     * 경도
     */
    @JsonProperty("longitude")
    private Double longitude;

    /**
     * 정확도 (미터 단위, GPS 정확도)
     */
    @JsonProperty("accuracy")
    private Double accuracy;

    /**
     * 속도 (m/s)
     */
    @JsonProperty("speed")
    private Double speed;

    /**
     * 고도 (미터)
     */
    @JsonProperty("altitude")
    private Double altitude;

    /**
     * 추가 메타데이터 (기기 정보 등)
     */
    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    /**
     * 현재 위치 여부
     */
    @JsonProperty("is_current")
    @Builder.Default
    private Boolean isCurrent = true;

    public boolean isValid() {
        return latitude != null && longitude != null &&
                latitude >= -90 && latitude <= 90 &&
                longitude >= -180 && longitude <= 180;
    }
}

