import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from '../components/MapWrapper';

import { createCourse, createRiding, getToiletsAlongRoute } from '../api/bikeoasis';
import { useSettingsStore } from '../state/settingsStore';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { PointDto, Toilet } from '../types/bikeoasis';
import { haversineMeters, formatMeters } from '../utils/distance';
import { downsample } from '../utils/downsample';

type RideStatus = 'idle' | 'running' | 'stopped';

const DEFAULT_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function nowMs() {
  return Date.now();
}

export default function RideScreen() {
  const mapRef = useRef<any | null>(null);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  const hasHydrated = useSettingsStore((s) => s.hasHydrated);
  const deviceUuid = useSettingsStore((s) => s.deviceUuid);
  const userId = useSettingsStore((s) => s.userId);
  const routeRadiusMeters = useSettingsStore((s) => s.routeRadiusMeters);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [status, setStatus] = useState<RideStatus>('idle');
  const [path, setPath] = useState<PointDto[]>([]);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [startAtMs, setStartAtMs] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [rideId, setRideId] = useState<number | null>(null);
  const [courseId, setCourseId] = useState<number | null>(null);

  const canStart = useMemo(() => {
    if (!hasHydrated) return false;
    if (!deviceUuid) return false;
    return status !== 'running';
  }, [deviceUuid, hasHydrated, status]);

  useEffect(() => {
    if (status !== 'running' || !startAtMs) return;
    const t = setInterval(() => {
      setElapsedSec(Math.floor((nowMs() - startAtMs) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [startAtMs, status]);

  useEffect(() => {
    return () => {
      watchSubRef.current?.remove();
      watchSubRef.current = null;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);
    return granted;
  }, []);

  const startRide = useCallback(async () => {
    if (!canStart) return;
    const granted = (permissionGranted === true) || (await requestPermission());
    if (!granted) {
      if (Platform.OS === 'web') {
        const demoPath: PointDto[] = [
          { lat: 37.5665, lon: 126.978 },
          { lat: 37.5671, lon: 126.9793 },
          { lat: 37.5678, lon: 126.9804 },
        ];
        const demoDistance =
          haversineMeters(demoPath[0], demoPath[1]) + haversineMeters(demoPath[1], demoPath[2]);

        setRideId(null);
        setToilets([]);
        setCourseId(null);
        setPath(demoPath);
        setDistanceMeters(demoDistance);
        setElapsedSec(180);
        setStartAtMs(nowMs() - 180000);
        setStatus('stopped');
        mapRef.current?.animateToRegion(
          {
            latitude: demoPath[0].lat,
            longitude: demoPath[0].lon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          400
        );
        Alert.alert('웹 테스트 모드', '위치 권한 없이 데모 경로를 생성했습니다. 바로 제출 테스트가 가능합니다.');
        return;
      }

      Alert.alert('권한 필요', '라이딩을 시작하려면 위치 권한이 필요합니다.');
      return;
    }

    setRideId(null);
    setToilets([]);
    setPath([]);
    setDistanceMeters(0);
    setElapsedSec(0);
    const startedAt = nowMs();
    setStartAtMs(startedAt);
    setStatus('running');

    const initial = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const firstPoint: PointDto = {
      lat: initial.coords.latitude,
      lon: initial.coords.longitude,
    };
    setPath([firstPoint]);
    const nextRegion: Region = {
      latitude: firstPoint.lat,
      longitude: firstPoint.lon,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    mapRef.current?.animateToRegion(nextRegion, 400);

    watchSubRef.current?.remove();
    watchSubRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (loc) => {
        const next: PointDto = {
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        };

        setPath((prev) => {
          const last = prev[prev.length - 1];
          if (!last) return [next];
          const d = haversineMeters(last, next);
          // Avoid noisy duplicates.
          if (d < 2) return prev;
          setDistanceMeters((m) => m + d);
          return [...prev, next];
        });
      }
    );
  }, [canStart, permissionGranted, requestPermission]);

  const stopRide = useCallback(async () => {
    if (status !== 'running') return;
    watchSubRef.current?.remove();
    watchSubRef.current = null;
    setStatus('stopped');
  }, [status]);

  const clearRide = useCallback(() => {
    watchSubRef.current?.remove();
    watchSubRef.current = null;
    setStatus('idle');
    setRideId(null);
    setCourseId(null);
    setToilets([]);
    setPath([]);
    setDistanceMeters(0);
    setElapsedSec(0);
    setStartAtMs(null);
  }, []);

  const handleCreateCourse = useCallback(async () => {
    if (!rideId) return;
    if (!deviceUuid) {
      Alert.alert('기기 식별자 없음', '기기 UUID가 아직 준비되지 않았습니다.');
      return;
    }
    if (path.length < 2) {
      Alert.alert('경로 포인트 부족', '코스로 저장하려면 경로를 조금 더 기록해 주세요.');
      return;
    }

    setBusy(true);
    try {
      const slimPath = downsample(path, 250);
      const cid = await createCourse({
        ownerUserId: userId,
        deviceUuid,
        title: `내 경로 ${new Date().toISOString().slice(0, 10)}`,
        description: '모바일 라이딩 기록으로 생성한 코스',
        visibility: 'public',
        sourceType: 'ugc',
        path: slimPath,
        tags: ['ugc'],
        warnings: [],
      });
      setCourseId(cid);
      Alert.alert('완료', `코스가 생성되었습니다. (ID: ${cid})`);
    } catch (e: any) {
      Alert.alert('코스 생성 실패', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }, [deviceUuid, path, rideId, userId]);

  const submitRide = useCallback(async () => {
    if (!deviceUuid) {
      Alert.alert('기기 식별자 없음', '기기 UUID가 아직 준비되지 않았습니다.');
      return;
    }
    if (!startAtMs) {
      Alert.alert('라이딩 없음', '먼저 라이딩을 시작해 주세요.');
      return;
    }
    if (path.length < 2) {
      Alert.alert('경로 포인트 부족', '제출하기 전에 경로를 조금 더 기록해 주세요.');
      return;
    }

    setBusy(true);
    try {
      const totalTime = elapsedSec;
      const avgSpeed = totalTime > 0 ? (distanceMeters / totalTime) * 3.6 : 0;
      const title = `라이딩 ${new Date().toISOString().slice(0, 10)}`;

      const slimPath = downsample(path, 250);

      const id = await createRiding({
        deviceUuid,
        userId,
        title,
        totalDistance: distanceMeters,
        totalTime,
        avgSpeed,
        path: slimPath,
      });
      setRideId(id);

      const nearby = await getToiletsAlongRoute({
        path: slimPath,
        radius: routeRadiusMeters,
      });
      setToilets(nearby);
    } catch (e: any) {
      Alert.alert('제출 실패', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }, [deviceUuid, distanceMeters, elapsedSec, path, routeRadiusMeters, startAtMs, userId]);

  const statusLabel = useMemo(() => {
    if (status === 'running') return '주행 중';
    if (status === 'stopped') return '정지';
    return '대기';
  }, [status]);

  const polylineCoords = useMemo(
    () => path.map((p) => ({ latitude: p.lat, longitude: p.lon })),
    [path]
  );

  const stats = useMemo(() => {
    const mm = Math.floor(elapsedSec / 60);
    const ss = elapsedSec % 60;
    const time = `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    return {
      time,
      distance: formatMeters(distanceMeters),
    };
  }, [distanceMeters, elapsedSec]);

  return (
    <View style={styles.container}>
      <MapView
        ref={(r: any) => {
          mapRef.current = r;
        }}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={permissionGranted === true}
      >
        {polylineCoords.length >= 2 ? (
          <Polyline
            coordinates={polylineCoords}
            strokeWidth={4}
            strokeColor="#1a2a44"
          />
        ) : null}

        {toilets.map((t) => (
          <Marker
            key={`${t.name}-${t.latitude}-${t.longitude}`}
            coordinate={{ latitude: t.latitude, longitude: t.longitude }}
            title={t.name}
            description={`${t.address}\n${t.openingHours}`}
          />
        ))}
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>라이딩</Text>
            <Text style={styles.badge}>{statusLabel}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.meta}>시간: {stats.time}</Text>
            <Text style={styles.meta}>거리: {stats.distance}</Text>
          </View>

          <View style={styles.row}>
            <Pressable
              style={[styles.primaryButton, !canStart ? styles.buttonDisabled : null]}
              onPress={startRide}
              disabled={!canStart}
            >
              <Text style={styles.primaryButtonText}>시작</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, status !== 'running' ? styles.buttonDisabled : null]}
              onPress={stopRide}
              disabled={status !== 'running'}
            >
              <Text style={styles.secondaryButtonText}>중지</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable
              style={[styles.ghostButton, status !== 'stopped' ? styles.buttonDisabled : null]}
              onPress={submitRide}
              disabled={status !== 'stopped' || busy}
            >
              <Text style={styles.ghostButtonText}>제출</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={clearRide} disabled={busy}>
              <Text style={styles.ghostButtonText}>초기화</Text>
            </Pressable>
          </View>

          {rideId !== null && courseId === null ? (
             <View style={styles.row}>
                <Pressable style={styles.primaryButton} onPress={handleCreateCourse} disabled={busy}>
                 <Text style={styles.primaryButtonText}>코스로 저장</Text>
                </Pressable>
             </View>
          ) : null}

          {busy ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
          {rideId !== null ? <Text style={styles.meta}>저장된 라이딩 ID: {rideId}</Text> : null}
          {courseId !== null ? <Text style={styles.meta}>저장된 코스 ID: {courseId}</Text> : null}
          {toilets.length > 0 ? (
            <Text style={styles.meta}>경로 주변 화장실: {toilets.length}개</Text>
          ) : null}
          {!deviceUuid && hasHydrated ? (
            <Text style={styles.warnText}>
              기기 UUID가 없습니다. 설정 화면을 확인하거나 앱을 재시작해 주세요.
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  overlay: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  cardTitle: { fontSize: typography.h2, fontWeight: '800', color: colors.ink },
  meta: { marginTop: spacing.xs, fontSize: typography.caption, color: '#3d587f' },
  warnText: { marginTop: spacing.sm, fontSize: typography.caption, color: colors.danger },
  badge: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.primaryDeep,
    backgroundColor: colors.softBlue,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  row: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm },
  rowBetween: { marginTop: spacing.xs, flexDirection: 'row', justifyContent: 'space-between' },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: typography.body, fontWeight: '800', color: '#ffffff' },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: typography.body, fontWeight: '800', color: '#ffffff' },
  ghostButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: { fontSize: typography.body, fontWeight: '800', color: colors.primaryDeep },
  buttonDisabled: { opacity: 0.5 },
});
