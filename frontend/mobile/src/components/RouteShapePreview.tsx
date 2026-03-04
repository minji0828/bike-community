import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import type { PointDto } from '../types/bikeoasis';

type Props = {
  points: PointDto[];
  height?: number;
  lineColor?: string;
  showEndpoints?: boolean;
};

function toSvgPoints(points: PointDto[], width: number, height: number, padding: number) {
  if (points.length < 2) return '';

  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLon = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;

  points.forEach((p) => {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
  });

  const lonSpan = Math.max(maxLon - minLon, 0.000001);
  const latSpan = Math.max(maxLat - minLat, 0.000001);

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  return points
    .map((p) => {
      const x = padding + ((p.lon - minLon) / lonSpan) * innerW;
      const y = padding + (1 - (p.lat - minLat) / latSpan) * innerH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function RouteShapePreview({
  points,
  height = 120,
  lineColor = '#1d4ed8',
  showEndpoints = false,
}: Props) {
  const width = 320;
  const padding = 12;

  const polylinePoints = useMemo(
    () => toSvgPoints(points, width, height, padding),
    [height, points]
  );

  const endpointPositions = useMemo(() => {
    if (!showEndpoints || points.length < 2 || !polylinePoints) return null;
    const rows = polylinePoints.split(' ');
    if (rows.length < 2) return null;

    const [sx, sy] = rows[0].split(',').map(Number);
    const [ex, ey] = rows[rows.length - 1].split(',').map(Number);
    return { sx, sy, ex, ey };
  }, [points.length, polylinePoints, showEndpoints]);

  if (points.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>경로 데이터 없음</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}> 
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={lineColor}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {endpointPositions ? (
          <>
            <Circle cx={endpointPositions.sx} cy={endpointPositions.sy} r={4} fill="#16a34a" />
            <Circle cx={endpointPositions.ex} cy={endpointPositions.ey} r={4} fill="#dc2626" />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#dbe8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4c6692',
  },
});

export default memo(RouteShapePreview);
