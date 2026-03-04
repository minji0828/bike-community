package com.bikeoasis.domain.course.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Slf4j
@Component
@RequiredArgsConstructor
public class CourseSeedLoader implements CommandLineRunner {

    private final CourseService courseService;

    @Value("${course.seed.gpx.onstartup:true}")
    private boolean seedOnStartup;

    @Value("${course.seed.gpx.path:설계/자료/동부5고개.gpx}")
    private String gpxPath;

    @Value("${course.seed.gpx.title:동부5고개 (벗서명다유)}")
    private String seedTitle;

    @Value("${course.seed.gpx.featured-rank:1}")
    private Integer featuredRank;

    @Override
    public void run(String... args) {
        if (!seedOnStartup) {
            return;
        }

        try {
            Path path = Path.of(gpxPath);
            if (!Files.exists(path)) {
                log.info("Course GPX seed file not found: {}", gpxPath);
                return;
            }

            String gpxXml = Files.readString(path, StandardCharsets.UTF_8);
            courseService.ensureSeedCourseFromGpx(seedTitle, gpxXml, featuredRank);
            log.info("Course GPX seed ensured: {}", seedTitle);
        } catch (Exception e) {
            log.error("Course GPX seed loading failed", e);
        }
    }
}
