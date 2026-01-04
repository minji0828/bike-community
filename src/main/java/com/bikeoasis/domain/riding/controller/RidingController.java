package com.bikeoasis.domain.riding.controller;

import com.bikeoasis.domain.riding.dto.RidingCreateRequest;
import com.bikeoasis.domain.riding.service.RidingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/ridings")
@RequiredArgsConstructor
public class RidingController {

    private final RidingService ridingService;

    @PostMapping
    public ResponseEntity<Long> createRiding(@RequestBody RidingCreateRequest request) {
        Long ridingId = ridingService.saveRiding(request);
        return ResponseEntity.ok(ridingId);
    }
}