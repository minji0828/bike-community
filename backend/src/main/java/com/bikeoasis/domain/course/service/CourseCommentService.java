package com.bikeoasis.domain.course.service;

import com.bikeoasis.domain.course.dto.CommentReportCreateRequest;
import com.bikeoasis.domain.course.entity.CommentReport;
import com.bikeoasis.domain.course.entity.Course;
import com.bikeoasis.domain.course.entity.CourseComment;
import com.bikeoasis.domain.course.enums.CourseCommentStatus;
import com.bikeoasis.domain.course.repository.CommentReportRepository;
import com.bikeoasis.domain.course.repository.CourseCommentRepository;
import com.bikeoasis.domain.course.repository.CourseRepository;
import com.bikeoasis.domain.user.entity.User;
import com.bikeoasis.domain.user.repository.UserRepository;
import com.bikeoasis.global.error.BusinessException;
import com.bikeoasis.global.ratelimit.DailyRateLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 코스 댓글 관련 비즈니스 로직을 담당하는 서비스다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseCommentService {

    private final CourseRepository courseRepository;
    private final CourseCommentRepository courseCommentRepository;
    private final CommentReportRepository commentReportRepository;
    private final UserRepository userRepository;
    private final DailyRateLimitService dailyRateLimitService;

    @Transactional
    public Long createComment(Long courseId, Long authorUserId, String body) {
        if (body == null || body.isBlank()) {
            throw new BusinessException(400, "body는 필수입니다.");
        }

        dailyRateLimitService.checkDaily(
                "comment_create",
                authorUserId,
                30,
                "댓글 작성은 하루 30회까지 가능합니다."
        );

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new BusinessException(404, "코스를 찾을 수 없습니다."));
        User user = userRepository.findById(authorUserId)
                .orElseThrow(() -> new BusinessException(401, "인증이 필요합니다."));

        CourseComment comment = CourseComment.builder()
                .course(course)
                .authorUser(user)
                .body(body.trim())
                .status(CourseCommentStatus.VISIBLE)
                .build();
        return courseCommentRepository.save(comment).getId();
    }

    public List<CourseComment> listComments(Long courseId, Long cursor, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        return courseCommentRepository.findByCourseIdCursor(
                courseId,
                cursor,
                List.of(CourseCommentStatus.VISIBLE),
                PageRequest.of(0, safeLimit)
        );
    }

    @Transactional
    public void deleteComment(Long commentId, Long requesterUserId) {
        CourseComment comment = courseCommentRepository.findByIdAndStatusIn(
                        commentId,
                        List.of(CourseCommentStatus.VISIBLE, CourseCommentStatus.HIDDEN)
                )
                .orElseThrow(() -> new BusinessException(404, "댓글을 찾을 수 없습니다."));

        Long authorId = comment.getAuthorUser().getId();
        if (!authorId.equals(requesterUserId)) {
            throw new BusinessException(403, "삭제 권한이 없습니다.");
        }
        comment.setStatus(CourseCommentStatus.DELETED);
        courseCommentRepository.save(comment);
    }

    @Transactional
    public void hideComment(Long commentId) {
        CourseComment comment = courseCommentRepository.findByIdAndStatusIn(
                        commentId,
                        List.of(CourseCommentStatus.VISIBLE, CourseCommentStatus.HIDDEN)
                )
                .orElseThrow(() -> new BusinessException(404, "댓글을 찾을 수 없습니다."));
        comment.setStatus(CourseCommentStatus.HIDDEN);
        courseCommentRepository.save(comment);
    }

    @Transactional
    public void unhideComment(Long commentId) {
        CourseComment comment = courseCommentRepository.findByIdAndStatusIn(
                        commentId,
                        List.of(CourseCommentStatus.VISIBLE, CourseCommentStatus.HIDDEN)
                )
                .orElseThrow(() -> new BusinessException(404, "댓글을 찾을 수 없습니다."));
        comment.setStatus(CourseCommentStatus.VISIBLE);
        courseCommentRepository.save(comment);
    }

    @Transactional
    public Long reportComment(Long commentId, Long reporterUserId, CommentReportCreateRequest request) {
        if (request == null || request.reason() == null || request.reason().isBlank()) {
            throw new BusinessException(400, "reason은 필수입니다.");
        }

        dailyRateLimitService.checkDaily(
                "comment_report",
                reporterUserId,
                50,
                "댓글 신고는 하루 50회까지 가능합니다."
        );

        CourseComment comment = courseCommentRepository.findByIdAndStatusIn(
                        commentId,
                        List.of(CourseCommentStatus.VISIBLE, CourseCommentStatus.HIDDEN)
                )
                .orElseThrow(() -> new BusinessException(404, "댓글을 찾을 수 없습니다."));

        if (commentReportRepository.existsByCommentIdAndReporterUserId(commentId, reporterUserId)) {
            throw new BusinessException(409, "이미 신고한 댓글입니다.");
        }

        User reporter = userRepository.findById(reporterUserId)
                .orElseThrow(() -> new BusinessException(401, "인증이 필요합니다."));

        CommentReport report = CommentReport.builder()
                .comment(comment)
                .reporterUser(reporter)
                .reason(request.reason().trim())
                .note(request.note() == null ? null : request.note().trim())
                .build();

        return commentReportRepository.save(report).getId();
    }
}
