package com.bikeoasis.infrastructure.seoul_api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;

/**
 * 서울 공공 데이터 API 클라이언트
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SeoulApiClient {
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${api.seoul.key}")
    private String apiKey;

    @Value("${api.seoul.base-url}")
    private String baseUrl;

    @Value("${api.seoul.timeout:5000}")
    private int timeout;

    @Value("${api.seoul.retry-count:3}")
    private int retryCount;

    @Value("${api.seoul.retry-delay:1000}")
    private long retryDelay;

    private static final String SERVICE_NAME = "mgisToiletPoi";

    /**
     * 서울 공공 화장실 API에서 데이터 조회
     * @param startIndex 시작 인덱스 (1부터)
     * @param endIndex 종료 인덱스
     * @return 화장실 데이터 리스트
     */
    public SeoulToiletApiResponse fetchToiletData(int startIndex, int endIndex) {
        String url = buildUrl(startIndex, endIndex);
        return callApiWithRetry(startIndex, endIndex, url);
    }

    /**
     * 단일 API 호출 (내부용)
     */
    private SeoulToiletApiResponse callApiWithRetry(int startIndex, int endIndex, String url) {
        for (int attempt = 1; attempt <= retryCount; attempt++) {
            try {
                log.info("서울 공공 API 호출 시도 {}/{} (service={}, range={}~{})",
                        attempt, retryCount, SERVICE_NAME, startIndex, endIndex);
                ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    log.info("API 호출 성공");
                    return parseResponse(response.getBody());
                }
            } catch (RestClientException e) {
                log.warn("API 호출 실패 (시도 {}/{}): {}", attempt, retryCount, e.getMessage());
                if (attempt < retryCount) {
                    try {
                        Thread.sleep(retryDelay * attempt); // 지수 백오프
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            } catch (Exception e) {
                log.error("예상치 못한 오류: {}", e.getMessage(), e);
                return new SeoulToiletApiResponse(new ArrayList<>(), 0);
            }
        }

        log.error("모든 재시도 실패. API를 호출할 수 없습니다.");
        return new SeoulToiletApiResponse(new ArrayList<>(), 0);
    }

    /**
     * API 응답 파싱
     */
    private SeoulToiletApiResponse parseResponse(String jsonBody) {
        try {
            JsonNode root = objectMapper.readTree(jsonBody);
            JsonNode serviceNode = root.get(SERVICE_NAME);

            if (serviceNode == null) {
                log.warn("API 응답에 '{}' 서비스가 없습니다.", SERVICE_NAME);
                return new SeoulToiletApiResponse(new ArrayList<>(), 0);
            }

            // 에러 메시지 확인
            if (serviceNode.has("RESULT")) {
                JsonNode resultNode = serviceNode.get("RESULT");
                String code = resultNode.path("CODE").asText("");
                String message = resultNode.path("MESSAGE").asText("");

                if (!"0".equals(code)) {
                    log.error("API 오류 (CODE: {}, MESSAGE: {})", code, message);
                    return new SeoulToiletApiResponse(new ArrayList<>(), 0);
                }
            }

            int totalCount = serviceNode.path("list_total_count").asInt(0);
            List<SeoulToiletRow> rows = new ArrayList<>();

            if (serviceNode.has("row") && serviceNode.get("row").isArray()) {
                serviceNode.get("row").forEach(row -> {
                    try {
                        SeoulToiletRow toilet = parseToiletRow(row);
                        if (toilet != null) {
                            rows.add(toilet);
                        }
                    } catch (Exception e) {
                        log.warn("화장실 데이터 파싱 오류: {}", e.getMessage());
                    }
                });
            }

            return new SeoulToiletApiResponse(rows, totalCount);

        } catch (Exception e) {
            log.error("JSON 파싱 오류: {}", e.getMessage(), e);
            return new SeoulToiletApiResponse(new ArrayList<>(), 0);
        }
    }

    /**
     * 화장실 행 파싱
     */
    private SeoulToiletRow parseToiletRow(JsonNode row) {
        try {
            String externalId = row.path("UID").asText(); // 고유 ID
            String name = row.path("CONTS_NAME").asText("");
            String address = row.path("ADDR_NEW").asText(row.path("ADDR_OLD").asText(""));
            double lon = row.path("COORD_X").asDouble(0);
            double lat = row.path("COORD_Y").asDouble(0);
            String openingHours = row.path("VALUE_02").asText("");

            // 데이터 유효성 검사
            if (lon == 0 || lat == 0 || name.isBlank()) {
                log.debug("유효하지 않은 화장실 데이터 무시: {}", externalId);
                return null;
            }

            // 운영시간 정제
            if (openingHours.endsWith("|")) {
                openingHours = openingHours.substring(0, openingHours.length() - 1);
            }

            return new SeoulToiletRow(externalId, name, address, lat, lon, openingHours);

        } catch (Exception e) {
            log.warn("화장실 데이터 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    /**
     * API URL 생성
     */
    private String buildUrl(int startIndex, int endIndex) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("API Key가 설정되지 않았습니다.");
        }
        return String.format("%s/%s/json/%s/%d/%d/",
                baseUrl, apiKey, SERVICE_NAME, startIndex, endIndex);
    }

    /**
     * 서울 API 응답 DTO
     */
    public record SeoulToiletApiResponse(
            List<SeoulToiletRow> rows,
            int totalCount
    ) {
        public boolean hasMore(int currentIndex) {
            return currentIndex <= totalCount;
        }
    }

    /**
     * 화장실 데이터 DTO
     */
    public record SeoulToiletRow(
            String externalId,      // 고유 ID
            String name,            // 화장실 명칭
            String address,         // 주소
            double latitude,        // 위도
            double longitude,       // 경도
            String openingHours     // 개방 시간
    ) {}
}

