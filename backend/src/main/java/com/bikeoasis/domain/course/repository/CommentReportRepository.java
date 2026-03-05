package com.bikeoasis.domain.course.repository;

import com.bikeoasis.domain.course.entity.CommentReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {

    boolean existsByCommentIdAndReporterUserId(Long commentId, Long reporterUserId);
}
