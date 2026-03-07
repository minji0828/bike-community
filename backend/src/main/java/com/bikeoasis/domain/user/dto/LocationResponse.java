package com.bikeoasis.domain.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.bikeoasis.domain.user.entity.UserLocation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 위치 조회 응답 DTO
 */

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationResponse {
    @JsonProperty("location_id")
    private Long locationId;

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;

    @JsonProperty("accuracy")
    private Double accuracy;

    @JsonProperty("speed")
    private Double speed;

    @JsonProperty("altitude")
    private Double altitude;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("is_current")
    private Boolean isCurrent;

    /**
     * UserLocation 엔티티에서 응답 DTO 변환
     */
    public static LocationResponse from(UserLocation location) {
        return LocationResponse.builder()
                .locationId(location.getId())
                .userId(location.getUser().getId())
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .accuracy(location.getAccuracy())
                .speed(location.getSpeed())
                .altitude(location.getAltitude())
                .metadata(location.getMetadata())
                .createdAt(location.getCreatedAt())
                .isCurrent(location.getIsCurrent())
                .build();
    }
}

