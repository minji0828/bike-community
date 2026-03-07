package com.bikeoasis.domain.course.service.gpx;

import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.global.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * S3 코스 GPX 관련 저장소 전략을 표현하는 구현다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "course.gpx.storage.mode", havingValue = "s3")
public class S3CourseGpxStorage implements CourseGpxStorage {

    private final S3Client s3Client;
    private final CourseGpxS3Properties properties;

    @Override
    public void store(Course course, String gpxXml) {
        String bucket = requireBucket();
        String key = buildObjectKey(course.getId());
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType("application/gpx+xml; charset=UTF-8")
                    .build();
            s3Client.putObject(request, RequestBody.fromString(gpxXml, StandardCharsets.UTF_8));
            course.setGpxObjectKey(key);
            course.setGpxData(null);
        } catch (S3Exception | SdkClientException e) {
            log.error("Failed to store GPX to S3. courseId={}", course.getId(), e);
            throw new BusinessException(500, "GPX 저장에 실패했습니다.");
        }
    }

    @Override
    public String load(Course course) {
        String objectKey = course.getGpxObjectKey();
        if (StringUtils.hasText(objectKey)) {
            try {
                ResponseBytes<GetObjectResponse> objectBytes = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                        .bucket(requireBucket())
                        .key(objectKey)
                        .build());
                return objectBytes.asString(StandardCharsets.UTF_8);
            } catch (S3Exception | SdkClientException e) {
                log.error("Failed to load GPX from S3. courseId={}, key={}", course.getId(), objectKey, e);
                throw new BusinessException(500, "GPX 조회에 실패했습니다.");
            }
        }

        return StringUtils.hasText(course.getGpxData()) ? course.getGpxData() : null;
    }

    private String requireBucket() {
        if (!StringUtils.hasText(properties.getBucket())) {
            throw new BusinessException(500, "S3 GPX 버킷 설정이 필요합니다.");
        }
        return properties.getBucket();
    }

    private String buildObjectKey(Long courseId) {
        String normalizedPrefix = normalizePrefix(properties.getPrefix());
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return normalizedPrefix + "/" + courseId + "/" + uuid + ".gpx";
    }

    private String normalizePrefix(String prefix) {
        String value = StringUtils.hasText(prefix) ? prefix.trim() : "courses/gpx";
        while (value.startsWith("/")) {
            value = value.substring(1);
        }
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }
}
