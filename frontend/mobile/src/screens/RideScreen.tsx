import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from '../components/MapWrapper';

import {
  createCourseFromRiding,
  createRiding,
  getToiletsAlongRoute,
  updateUserLocation,
} from '../api/bikeoasis';
import { AppButton, AppCard, AppChip, ScreenContainer } from '../components/ui';
import { useSettingsStore } from '../state/settingsStore';
import { colors, spacing, typography } from '../theme/tokens';
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
  const accessToken = useSettingsStore((s) => s.accessToken);
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
  const [locationSyncStatus, setLocationSyncStatus] = useState<'off' | 'syncing' | 'ok' | 'error'>('off');

  const lastLocationSyncAtRef = useRef(0);
  const locationSyncInFlightRef = useRef(false);

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

  const syncLocationBestEffort = useCallback(
    (coords: Location.LocationObjectCoords) => {
      if (userId === null || !accessToken) {
        setLocationSyncStatus('off');
        return;
      }

      const now = Date.now();
      if (now - lastLocationSyncAtRef.current < 10000) {
        return;
      }
      if (locationSyncInFlightRef.current) {
        return;
      }

      locationSyncInFlightRef.current = true;
      setLocationSyncStatus('syncing');

      void updateUserLocation(userId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? undefined,
        speed: coords.speed ?? undefined,
        altitude: coords.altitude ?? undefined,
        metadata: {
          source: 'ride_screen',
          heading: coords.heading ?? null,
        },
      })
        .then(() => {
          lastLocationSyncAtRef.current = now;
          setLocationSyncStatus('ok');
        })
        .catch(() => {
          setLocationSyncStatus('error');
        })
        .finally(() => {
          locationSyncInFlightRef.current = false;
        });
    },
    [accessToken, userId]
  );

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
    setLocationSyncStatus(userId === null || !accessToken ? 'off' : 'syncing');
    lastLocationSyncAtRef.current = 0;
    locationSyncInFlightRef.current = false;
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
        syncLocationBestEffort(loc.coords);
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
  }, [accessToken, canStart, permissionGranted, requestPermission, syncLocationBestEffort, userId]);

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
    setLocationSyncStatus('off');
    lastLocationSyncAtRef.current = 0;
    locationSyncInFlightRef.current = false;
  }, []);

  const handleCreateCourse = useCallback(async () => {
    if (!rideId) return;

    setBusy(true);
    try {
      const cid = await createCourseFromRiding({
        ridingId: rideId,
        title: `내 경로 ${new Date().toISOString().slice(0, 10)}`,
        visibility: 'public',
        sourceType: 'ugc',
        tags: ['ugc'],
        notes: '모바일 라이딩 기록으로 생성한 코스',
        warnings: [],
      });
      setCourseId(cid);
      Alert.alert('완료', `코스가 생성되었습니다. (ID: ${cid})`);
    } catch (e: any) {
      Alert.alert('코스 생성 실패', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }, [rideId]);

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
    <ScreenContainer>
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
            key={`${t.name}-${t.lat}-${t.lon}`}
            coordinate={{ latitude: t.lat, longitude: t.lon }}
            title={t.name}
            description={`${t.address}\n${t.openingHours}`}
          />
        ))}
      </MapView>

      <View style={styles.overlay}>
        <AppCard style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>라이딩</Text>
            <AppChip text={statusLabel} tone={status === 'running' ? 'success' : 'info'} />
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.meta}>시간: {stats.time}</Text>
            <Text style={styles.meta}>거리: {stats.distance}</Text>
          </View>

          <View style={styles.row}>
            <AppButton
              variant="secondary"
              style={!canStart ? styles.buttonDisabled : null}
              onPress={startRide}
              disabled={!canStart}
              label="시작"
              full
            />
            <AppButton
              variant="danger"
              style={status !== 'running' ? styles.buttonDisabled : null}
              onPress={stopRide}
              disabled={status !== 'running'}
              label="중지"
              full
            />
          </View>

          <View style={styles.row}>
            <AppButton
              variant="ghost"
              style={status !== 'stopped' ? styles.buttonDisabled : null}
              onPress={submitRide}
              disabled={status !== 'stopped' || busy}
              label="제출"
              full
            />
            <AppButton variant="ghost" onPress={clearRide} disabled={busy} label="초기화" full />
          </View>

          {rideId !== null && courseId === null ? (
             <View style={styles.row}>
                <AppButton variant="secondary" label="코스로 저장" onPress={handleCreateCourse} disabled={busy} full />
             </View>
          ) : null}

          {busy ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
          {rideId !== null ? <Text style={styles.meta}>저장된 라이딩 ID: {rideId}</Text> : null}
          {courseId !== null ? <Text style={styles.meta}>저장된 코스 ID: {courseId}</Text> : null}
          {toilets.length > 0 ? (
            <Text style={styles.meta}>경로 주변 화장실: {toilets.length}개</Text>
          ) : null}
          <Text style={styles.meta}>
            위치 동기화:{' '}
            {locationSyncStatus === 'off'
              ? '비활성(로그인+userId 필요)'
              : locationSyncStatus === 'syncing'
                ? '동기화 중'
                : locationSyncStatus === 'ok'
                  ? '정상'
                  : '오류'}
          </Text>
          {!deviceUuid && hasHydrated ? (
            <Text style={styles.warnText}>
              기기 UUID가 없습니다. 설정 화면을 확인하거나 앱을 재시작해 주세요.
            </Text>
          ) : null}
        </AppCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  overlay: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md },
  card: { backgroundColor: colors.mapCard },
  cardTitle: { fontSize: typography.h2, fontWeight: '800', color: colors.ink },
  meta: { marginTop: spacing.xs, fontSize: typography.caption, color: colors.textMuted },
  warnText: { marginTop: spacing.sm, fontSize: typography.caption, color: colors.danger },
  row: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm },
  rowBetween: { marginTop: spacing.xs, flexDirection: 'row', justifyContent: 'space-between' },
  buttonDisabled: { opacity: 0.5 },
});
