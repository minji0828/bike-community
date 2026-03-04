import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';

import { createRiding, getToiletsAlongRoute } from '../api/bikeoasis';
import { useSettingsStore } from '../state/settingsStore';
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
  const mapRef = useRef<MapView | null>(null);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  const hasHydrated = useSettingsStore((s) => s.hasHydrated);
  const deviceUuid = useSettingsStore((s) => s.deviceUuid);
  const userId = useSettingsStore((s) => s.userId);
  const routeRadiusMeters = useSettingsStore((s) => s.routeRadiusMeters);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [status, setStatus] = useState<RideStatus>('idle');
  const [path, setPath] = useState<PointDto[]>([]);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [distanceMeters, setDistanceMeters] = useState(0);
  const [startAtMs, setStartAtMs] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const [rideId, setRideId] = useState<number | null>(null);

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
      Alert.alert('Permission required', 'Location permission is required to start a ride.');
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
    setRegion(nextRegion);
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
    setToilets([]);
    setPath([]);
    setDistanceMeters(0);
    setElapsedSec(0);
    setStartAtMs(null);
  }, []);

  const submitRide = useCallback(async () => {
    if (!deviceUuid) {
      Alert.alert('Missing device id', 'Device UUID is not ready yet.');
      return;
    }
    if (!startAtMs) {
      Alert.alert('No ride', 'Start a ride first.');
      return;
    }
    if (path.length < 2) {
      Alert.alert('Not enough points', 'Record a bit more before submitting.');
      return;
    }

    setBusy(true);
    try {
      const totalTime = elapsedSec;
      const avgSpeed = totalTime > 0 ? (distanceMeters / totalTime) * 3.6 : 0;
      const title = `Ride ${new Date().toISOString().slice(0, 10)}`;

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
      Alert.alert('Submit failed', String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }, [deviceUuid, distanceMeters, elapsedSec, path, routeRadiusMeters, startAtMs, userId]);

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
        ref={(r) => {
          mapRef.current = r;
        }}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        region={region}
        onRegionChangeComplete={setRegion}
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
            <Text style={styles.cardTitle}>Ride</Text>
            <Text style={styles.badge}>{status.toUpperCase()}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.meta}>Time: {stats.time}</Text>
            <Text style={styles.meta}>Distance: {stats.distance}</Text>
          </View>

          <View style={styles.row}>
            <Pressable
              style={[styles.primaryButton, !canStart ? styles.buttonDisabled : null]}
              onPress={startRide}
              disabled={!canStart}
            >
              <Text style={styles.primaryButtonText}>Start</Text>
            </Pressable>
            <Pressable
              style={[styles.secondaryButton, status !== 'running' ? styles.buttonDisabled : null]}
              onPress={stopRide}
              disabled={status !== 'running'}
            >
              <Text style={styles.secondaryButtonText}>Stop</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <Pressable
              style={[styles.ghostButton, status !== 'stopped' ? styles.buttonDisabled : null]}
              onPress={submitRide}
              disabled={status !== 'stopped' || busy}
            >
              <Text style={styles.ghostButtonText}>Submit</Text>
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={clearRide} disabled={busy}>
              <Text style={styles.ghostButtonText}>Clear</Text>
            </Pressable>
          </View>

          {busy ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}
          {rideId !== null ? <Text style={styles.meta}>Saved ride id: {rideId}</Text> : null}
          {toilets.length > 0 ? (
            <Text style={styles.meta}>Toilets along route: {toilets.length}</Text>
          ) : null}
          {!deviceUuid && hasHydrated ? (
            <Text style={styles.warnText}>
              Device UUID is missing. Open Settings or restart the app.
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
  overlay: { position: 'absolute', left: 12, right: 12, bottom: 12 },
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
  meta: { marginTop: 6, fontSize: 12, color: '#445066' },
  warnText: { marginTop: 8, fontSize: 12, color: '#8a2b2b' },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a2a44',
    backgroundColor: '#e7edf6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  row: { marginTop: 10, flexDirection: 'row', gap: 8 },
  rowBetween: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  primaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1a2a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  ghostButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e7edf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: { fontSize: 14, fontWeight: '700', color: '#1a2a44' },
  buttonDisabled: { opacity: 0.5 },
});
