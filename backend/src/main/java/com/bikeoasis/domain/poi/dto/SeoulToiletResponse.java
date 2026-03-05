package com.bikeoasis.domain.poi.dto;

import java.util.List;

public record SeoulToiletResponse(
        SearchPublicToiletPoiservice SearchPublicToiletPoiservice
) {
    public record SearchPublicToiletPoiservice(
            int list_total_count,
            List<ToiletRow> row
    ) {}

    public record ToiletRow(
            String FNAME,      // 화장실 명칭
            String ANAME,      // 주소
            String Y_WGS84,    // 위도 (Latitude)
            String X_WGS84,    // 경도 (Longitude)
            String OP_TIME     // 개방 시간
    ) {}
}