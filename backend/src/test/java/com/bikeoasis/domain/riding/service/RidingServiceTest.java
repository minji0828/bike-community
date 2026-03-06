package com.bikeoasis.domain.riding.service;

import com.bikeoasis.domain.riding.dto.RidingCreateRequest;
import com.bikeoasis.domain.riding.entity.Riding;
import com.bikeoasis.domain.riding.repository.RidingRepository;
import com.bikeoasis.global.error.BusinessException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RidingServiceTest {

    @Mock
    private RidingRepository ridingRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private RidingService ridingService;

    @BeforeEach
    void setUp() {
        ridingService = new RidingService(ridingRepository, geometryFactory);
    }

    @Test
    void saveRiding_acceptsLngAliasAndSetsSrid4326() throws Exception {
        // language=JSON
        String json = """
                {
                  "deviceUuid": "device-1",
                  "userId": 1,
                  "title": "ride",
                  "totalDistance": 1234.5,
                  "totalTime": 360,
                  "avgSpeed": 12.3,
                  "path": [
                    { "lat": 37.1, "lng": 127.1 },
                    { "lat": 37.2, "lng": 127.2 }
                  ]
                }
                """;

        RidingCreateRequest request = objectMapper.readValue(json, RidingCreateRequest.class);

        ArgumentCaptor<Riding> captor = ArgumentCaptor.forClass(Riding.class);
        when(ridingRepository.save(captor.capture())).thenAnswer(invocation -> {
            Riding riding = invocation.getArgument(0);
            return Riding.builder()
                    .id(1L)
                    .userId(riding.getUserId())
                    .deviceUuid(riding.getDeviceUuid())
                    .title(riding.getTitle())
                    .totalDistance(riding.getTotalDistance())
                    .totalTime(riding.getTotalTime())
                    .avgSpeed(riding.getAvgSpeed())
                    .pathData(riding.getPathData())
                    .build();
        });

        Long savedId = ridingService.saveRiding(request);

        Assertions.assertThat(savedId).isEqualTo(1L);

        Riding saved = captor.getValue();
        Assertions.assertThat(saved.getDeviceUuid()).isEqualTo("device-1");

        LineString pathData = saved.getPathData();
        Assertions.assertThat(pathData).isNotNull();
        Assertions.assertThat(pathData.getSRID()).isEqualTo(4326);

        Coordinate first = pathData.getCoordinateN(0);
        Assertions.assertThat(first.x).isEqualTo(127.1);
        Assertions.assertThat(first.y).isEqualTo(37.1);
    }

    @Test
    void saveRiding_throws400WhenDeviceUuidMissing() throws Exception {
        // language=JSON
        String json = """
                { "path": [ { "lat": 37.1, "lon": 127.1 }, { "lat": 37.2, "lon": 127.2 } ] }
                """;
        RidingCreateRequest request = objectMapper.readValue(json, RidingCreateRequest.class);

        BusinessException ex = Assertions.catchThrowableOfType(
                () -> ridingService.saveRiding(request),
                BusinessException.class
        );

        Assertions.assertThat(ex.getCode()).isEqualTo(400);
        Assertions.assertThat(ex.getMessage()).contains("deviceUuid");
    }

    @Test
    void saveRiding_throws400WhenPathMissing() throws Exception {
        // language=JSON
        String json = """
                { "deviceUuid": "device-1" }
                """;
        RidingCreateRequest request = objectMapper.readValue(json, RidingCreateRequest.class);

        BusinessException ex = Assertions.catchThrowableOfType(
                () -> ridingService.saveRiding(request),
                BusinessException.class
        );

        Assertions.assertThat(ex.getCode()).isEqualTo(400);
        Assertions.assertThat(ex.getMessage()).contains("path");
    }

    @Test
    void saveRiding_throws400WhenPathTooShort() throws Exception {
        // language=JSON
        String json = """
                { "deviceUuid": "device-1", "path": [ { "lat": 37.1, "lon": 127.1 } ] }
                """;
        RidingCreateRequest request = objectMapper.readValue(json, RidingCreateRequest.class);

        BusinessException ex = Assertions.catchThrowableOfType(
                () -> ridingService.saveRiding(request),
                BusinessException.class
        );

        Assertions.assertThat(ex.getCode()).isEqualTo(400);
        Assertions.assertThat(ex.getMessage()).contains("path");
    }
}

