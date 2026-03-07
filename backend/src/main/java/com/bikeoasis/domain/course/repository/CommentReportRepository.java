package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CommentReport;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 댓글 신고 관련 데이터 접근을 담당하는 리포지토리다.
 */
public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {

    boolean existsByCommentIdAndReporterUserId(Long commentId, Long reporterUserId);
}
