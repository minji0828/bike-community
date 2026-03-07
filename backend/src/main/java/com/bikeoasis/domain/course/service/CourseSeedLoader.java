package com.bikeoasis.domain.course.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * 코스 시드 관련 비즈니스 로직을 담당하는 서비스다.
 */
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

    @Value("${course.seed.gpx.directory:자전거코스여행60선}")
    private String gpxDirectory;

    @Override
    public void run(String... args) {
        if (!seedOnStartup) {
            return;
        }

        try {
            Path path = resolveSeedPath();
            if (!Files.exists(path)) {
                log.info("Course GPX seed file not found: {}", gpxPath);
                return;
            }

            String gpxXml = Files.readString(path, StandardCharsets.UTF_8);
            courseService.ensureSeedCourseFromGpx(seedTitle, gpxXml, featuredRank);
            log.info("Course GPX seed ensured: {}", seedTitle);

            loadDirectorySeeds();
        } catch (Exception e) {
            log.error("Course GPX seed loading failed", e);
        }
    }

    private Path resolveSeedPath() {
        List<Path> candidates = List.of(
                Path.of(gpxPath),
                Path.of("..").resolve(gpxPath).normalize()
        );

        return candidates.stream()
                .filter(Files::exists)
                .findFirst()
                .orElse(candidates.get(0));
    }

    private void loadDirectorySeeds() {
        Path directory = resolveSeedResource(gpxDirectory);
        if (!Files.isDirectory(directory)) {
            log.info("Course GPX seed directory not found: {}", gpxDirectory);
            return;
        }

        try (Stream<Path> paths = Files.list(directory)) {
            List<Path> gpxFiles = paths
                    .filter(path -> Files.isRegularFile(path) && path.getFileName().toString().toLowerCase().endsWith(".gpx"))
                    .sorted(Comparator.comparingInt(this::extractOrder).thenComparing(path -> path.getFileName().toString()))
                    .toList();

            int rank = featuredRank == null ? 1 : featuredRank + 1;
            for (Path gpxFile : gpxFiles) {
                String fileName = gpxFile.getFileName().toString();
                String title = toCourseTitle(fileName);
                String gpxXml = Files.readString(gpxFile, StandardCharsets.UTF_8);
                courseService.ensureSeedCourseFromGpx(title, gpxXml, rank++);
            }

            log.info("Course GPX directory seeds ensured: {} files from {}", gpxFiles.size(), gpxDirectory);
        } catch (Exception e) {
            log.error("Course GPX directory seed loading failed: {}", gpxDirectory, e);
        }
    }

    private Path resolveSeedResource(String value) {
        List<Path> candidates = List.of(
                Path.of(value),
                Path.of("..").resolve(value).normalize()
        );

        return candidates.stream()
                .filter(Files::exists)
                .findFirst()
                .orElse(candidates.get(0));
    }

    private int extractOrder(Path path) {
        Matcher matcher = Pattern.compile("^(\\d+)").matcher(path.getFileName().toString());
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return Integer.MAX_VALUE;
    }

    private String toCourseTitle(String fileName) {
        return fileName
                .replaceFirst("^\\d+\\.", "")
                .replaceFirst("\\.gpx$", "")
                .trim();
    }
}
