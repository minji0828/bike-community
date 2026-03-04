package com.bikeoasis.domain.poi.controller;

import com.bikeoasis.domain.poi.dto.ToiletResponseDto;
import com.bikeoasis.domain.poi.service.PoiService;
import com.bikeoasis.global.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.bikeoasis.domain.riding.dto.RidingCreateRequest.PointDto;
import java.util.List;

/**
 * POI API 엔드포인트
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/pois")
@RequiredArgsConstructor
public class PoiController {
    private final PoiService poiService;

    @PostMapping("/sync/full")
    @Operation(summary = "화장실 데이터 전체 새로고침", description = "기존 데이터 삭제 후 최신 화장실 정보를 새로 적재합니다. (초기 구축/대대적 업데이트 용)")
    public ResponseEntity<ApiResponse<String>> syncToiletsFullRefresh() {
        try {
            poiService.fetchAndSaveSeoulToiletsFullRefresh();
            return ResponseEntity.ok(ApiResponse.success("화장실 데이터 전체 새로고침 완료"));
        } catch (Exception e) {
            log.error("화장실 데이터 동기화 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("화장실 데이터 동기화 실패: " + e.getMessage()));
        }
    }

    @PostMapping("/sync/incremental")
    @Operation(summary = "화장실 데이터 증분 동기화", description = "변경사항만 반영하여 DB를 업데이트합니다. (일일 정기 동기화 용)")
    public ResponseEntity<ApiResponse<String>> syncToiletsIncremental() {
        try {
            poiService.fetchAndSaveSeoulToiletsIncremental();
            return ResponseEntity.ok(ApiResponse.success("화장실 데이터 증분 동기화 완료"));
        } catch (Exception e) {
            log.error("화장실 데이터 동기화 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("화장실 데이터 동기화 실패: " + e.getMessage()));
        }
    }

    @PostMapping("/sync/toilets")
    @Operation(summary = "화장실 데이터 동기화 (자동 모드)", description = "설정된 동기화 모드(전체/증분)에 따라 자동으로 동기화합니다.")
    public ResponseEntity<ApiResponse<String>> syncToilets() {
        try {
            poiService.fetchAndSaveSeoulToilets();
            return ResponseEntity.ok(ApiResponse.success("화장실 데이터 동기화 완료"));
        } catch (Exception e) {
            log.error("화장실 데이터 동기화 실패", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("화장실 데이터 동기화 실패: " + e.getMessage()));
        }
    }

    @GetMapping("/nearby")
    @Operation(summary = "내 주변 화장실 조회", description = "위경도 좌표와 반경(m)을 기준으로 주변 화장실 목록을 반환합니다.")
    public ResponseEntity<ApiResponse<List<ToiletResponseDto>>> getNearbyToilets(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "500") double radius) {

        List<ToiletResponseDto> result = poiService.getNearbyToilets(lat, lon, radius);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/along-route")
    @Operation(summary = "경로 주변 화장실 조회", description = "전체 라이딩 경로(좌표 리스트) 주변의 화장실을 조회합니다.")
    public ResponseEntity<ApiResponse<List<ToiletResponseDto>>> getToiletsAlongRoute(
            @RequestBody List<PointDto> path,
            @RequestParam(defaultValue = "100") double radius) {

        List<ToiletResponseDto> result = poiService.getToiletsAlongRoute(path, radius);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
