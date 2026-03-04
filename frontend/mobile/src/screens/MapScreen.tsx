import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

import { getNearbyToilets } from '../api/bikeoasis';
import { useSettingsStore } from '../state/settingsStore';
import type { Toilet } from '../types/bikeoasis';

const DEFAULT_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const mapRef = useRef<MapView | null>(null);

  const nearbyRadiusMeters = useSettingsStore((s) => s.nearbyRadiusMeters);
  const setNearbyRadiusMeters = useSettingsStore((s) => s.setNearbyRadiusMeters);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [currentLatLon, setCurrentLatLon] = useState<{ lat: number; lon: number } | null>(null);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(false);

  const canFetch = useMemo(
    () => permissionGranted === true && currentLatLon !== null,
    [permissionGranted, currentLatLon]
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) return;

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
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 400);
    })().catch((e) => {
      setPermissionGranted(false);
      Alert.alert('Location error', String(e?.message ?? e));
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
      Alert.alert('Fetch failed', String(e?.message ?? e));
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
        ref={(r) => {
          mapRef.current = r;
        }}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        region={region}
        onRegionChangeComplete={setRegion}
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
          <Text style={styles.cardTitle}>Nearby toilets</Text>
          <Text style={styles.cardMeta}>Radius: {nearbyRadiusMeters} m</Text>
          <View style={styles.row}>
            <Pressable style={styles.smallButton} onPress={() => bumpRadius(-250)}>
              <Text style={styles.smallButtonText}>-</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={fetchNearby}>
              <Text style={styles.primaryButtonText}>Refresh</Text>
            </Pressable>
            <Pressable style={styles.smallButton} onPress={() => bumpRadius(250)}>
              <Text style={styles.smallButtonText}>+</Text>
            </Pressable>
          </View>
          <Text style={styles.cardMeta}>Results: {toilets.length}</Text>
          {loading ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
          {permissionGranted === false ? (
            <Text style={styles.warnText}>
              Location permission is required to show nearby results.
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f14' },
  map: { flex: 1 },
  overlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#101827' },
  cardMeta: { marginTop: 4, fontSize: 12, color: '#445066' },
  warnText: { marginTop: 8, fontSize: 12, color: '#8a2b2b' },
  row: { marginTop: 10, flexDirection: 'row', gap: 8, alignItems: 'center' },
  smallButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e7edf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: { fontSize: 18, fontWeight: '800', color: '#1a2a44' },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1a2a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
});
