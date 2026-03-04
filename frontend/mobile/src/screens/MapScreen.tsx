import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from '../components/MapWrapper';

import { getNearbyToilets } from '../api/bikeoasis';
import { useSettingsStore } from '../state/settingsStore';
import { colors, radius, spacing, typography } from '../theme/tokens';
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
    <View style={styles.container}>
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
            key={`${t.name}-${t.latitude}-${t.longitude}`}
            coordinate={{ latitude: t.latitude, longitude: t.longitude }}
            title={t.name}
            description={`${t.address}\n${t.openingHours}`}
          />
        ))}
      </MapView>

      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>주변 화장실</Text>
          <Text style={styles.cardMeta}>반경: {nearbyRadiusMeters}m</Text>
          <View style={styles.row}>
            <Pressable style={styles.smallButton} onPress={() => bumpRadius(-250)}>
              <Text style={styles.smallButtonText}>-</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={fetchNearby}>
              <Text style={styles.primaryButtonText}>새로고침</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => bumpRadius(250)}>
              <Text style={styles.smallButtonText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.cardMeta}>검색 결과: {toilets.length}개</Text>
          {loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
          {permissionGranted === false ? (
            <Text style={styles.warnText}>
              위치 권한이 없어서 서울 시청 기준으로 조회합니다.
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
  overlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 4,
  },
  cardTitle: { fontSize: typography.h2, fontWeight: '800', color: colors.ink },
  cardMeta: { marginTop: spacing.xs, fontSize: typography.caption, color: '#35507a' },
  warnText: { marginTop: spacing.sm, fontSize: typography.caption, color: colors.danger },
  row: { marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  smallButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: { fontSize: 18, fontWeight: '900', color: colors.primaryDeep },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: typography.body, fontWeight: '800', color: '#ffffff' },
});
