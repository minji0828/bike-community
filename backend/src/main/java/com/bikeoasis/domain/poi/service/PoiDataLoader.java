package com.bikeoasis.domain.poi.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PoiDataLoader implements CommandLineRunner {
    private final PoiService poiService;

    @Value("${poi.fetch.onstartup:false}")
    private boolean fetchOnStartup;

    @Value("${poi.fetch.mode:incremental}")
    private String syncMode;

    @Override
    public void run(String... args) throws Exception {
        if (fetchOnStartup) {
            try {
                log.info("========================================");
                log.info("POI 데이터 동기화 시작 (모드: {})", syncMode);
                log.info("========================================");

                poiService.fetchAndSaveSeoulToilets();

                log.info("========================================");
                log.info("POI 데이터 동기화 완료 ✓");
                log.info("========================================");
            } catch (Exception e) {
                log.error("========================================");
                log.error("POI 데이터 동기화 실패 ✗", e);
                log.error("========================================");
                // 애플리케이션 시작 계속 진행 (선택사항: throw e로 변경 가능)
            }
        } else {
            log.info("POI fetch on startup disabled (poi.fetch.onstartup=false)");
        }
    }
}

