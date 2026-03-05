package com.bikeoasis.global.ratelimit;

import com.bikeoasis.global.error.BusinessException;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DailyRateLimitService {

    private final ConcurrentHashMap<String, DailyCounter> counters = new ConcurrentHashMap<>();
    private final ZoneId zoneId = ZoneId.systemDefault();

    public void checkDaily(String action, Long actorId, int limit, String messageOnLimit) {
        if (limit <= 0) {
            return;
        }
        if (action == null || action.isBlank()) {
            return;
        }
        if (actorId == null) {
            return;
        }

        LocalDate today = LocalDate.now(zoneId);
        String key = action + ":" + actorId;

        DailyCounter counter = counters.compute(key, (k, existing) -> {
            if (existing == null || !today.equals(existing.day())) {
                return new DailyCounter(today);
            }
            return existing;
        });

        int current = counter.incrementAndGet();
        if (current > limit) {
            throw new BusinessException(429, messageOnLimit == null || messageOnLimit.isBlank()
                    ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
                    : messageOnLimit);
        }
    }

    private static final class DailyCounter {
        private final LocalDate day;
        private int count;

        private DailyCounter(LocalDate day) {
            this.day = day;
            this.count = 0;
        }

        private LocalDate day() {
            return day;
        }

        private synchronized int incrementAndGet() {
            count++;
            return count;
        }
    }
}
