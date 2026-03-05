import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from '../components/MapWrapper';
import { AppButton, AppCard, ScreenContainer } from '../components/ui';

import { getNearbyToilets } from '../api/bikeoasis';
import { useSettingsStore } from '../state/settingsStore';
import { colors, spacing, typography } from '../theme/tokens';
import type { Toilet } from '../types/bikeoasis';

const DEFAULT_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const mapRef = useRef<any | null>(null);

  const nearbyRadiusMeters = useSettingsStore((s) => s.nearbyRadiusMeters);
  const setNearbyRadiusMeters = useSettingsStore((s) => s.setNearbyRadiusMeters);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [currentLatLon, setCurrentLatLon] = useState<{ lat: number; lon: number } | null>(null);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(false);

  const canFetch = useMemo(() => currentLatLon !== null, [currentLatLon]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) {
        setCurrentLatLon({ lat: DEFAULT_REGION.latitude, lon: DEFAULT_REGION.longitude });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setCurrentLatLon({ lat, lon });

      const nextRegion: Region = {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(nextRegion, 400);
    })().catch((e) => {
      setPermissionGranted(false);
      setCurrentLatLon({ lat: DEFAULT_REGION.latitude, lon: DEFAULT_REGION.longitude });
      Alert.alert('위치 오류', String(e?.message ?? e));
    });
  }, []);

  const fetchNearby = useCallback(async () => {
    if (!canFetch || !currentLatLon) return;
    setLoading(true);
    try {
      const data = await getNearbyToilets({
        lat: currentLatLon.lat,
        lon: currentLatLon.lon,
        radius: nearbyRadiusMeters,
      });
      setToilets(data);
    } catch (e: any) {
      Alert.alert('조회 실패', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [canFetch, currentLatLon, nearbyRadiusMeters]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  const bumpRadius = useCallback(
    (delta: number) => {
      const next = Math.max(100, Math.min(5000, nearbyRadiusMeters + delta));
      setNearbyRadiusMeters(next);
    },
    [nearbyRadiusMeters, setNearbyRadiusMeters]
  );

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
          <Text style={styles.cardTitle}>주변 화장실</Text>
          <Text style={styles.cardMeta}>반경: {nearbyRadiusMeters}m</Text>
          <View style={styles.row}>
            <AppButton label="-" onPress={() => bumpRadius(-250)} variant="ghost" style={styles.compactBtn} />
            <AppButton label="새로고침" onPress={fetchNearby} variant="secondary" full />
            <AppButton label="+" onPress={() => bumpRadius(250)} variant="ghost" style={styles.compactBtn} />
          </View>
          <Text style={styles.cardMeta}>검색 결과: {toilets.length}개</Text>
          {loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
          {permissionGranted === false ? (
            <Text style={styles.warnText}>
              위치 권한이 없어서 서울 시청 기준으로 조회합니다.
            </Text>
          ) : null}
        </AppCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  overlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  card: { backgroundColor: colors.mapCard },
  cardTitle: { fontSize: typography.h2, fontWeight: '800', color: colors.ink },
  cardMeta: { marginTop: spacing.xs, fontSize: typography.caption, color: colors.textMuted },
  warnText: { marginTop: spacing.sm, fontSize: typography.caption, color: colors.danger },
  row: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  compactBtn: { width: 48, paddingHorizontal: 0 },
});
