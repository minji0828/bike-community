import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Polyline } from '../components/MapWrapper';
import * as Location from 'expo-location';

import { getCourseDetail } from '../api/bikeoasis';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { CourseDetail, PointDto } from '../types/bikeoasis';
import { minDistanceToPathMeters } from '../utils/distance';

type FollowRouteProp = RouteProp<RootStackParamList, 'CourseFollow'>;
type FollowNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourseFollow'>;

const OFF_ROUTE_THRESHOLD_METERS = 30;
const HYSTERESIS_METERS = 10; // Must be within 20m to say we're back on route

export default function CourseFollowScreen() {
  const route = useRoute<FollowRouteProp>();
  const navigation = useNavigation<FollowNavigationProp>();
  const mapRef = useRef<any | null>(null);
  const watchSubRef = useRef<Location.LocationSubscription | null>(null);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentLoc, setCurrentLoc] = useState<PointDto | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [distanceToRoute, setDistanceToRoute] = useState<number | null>(null);
  const [followingMap, setFollowingMap] = useState(true); // lock map to user

  useEffect(() => {
    async function fetchCourse() {
      try {
        const data = await getCourseDetail(route.params.courseId);
        setCourse(data);
      } catch (e: any) {
        Alert.alert('조회 실패', String(e?.message ?? e));
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    }
    fetchCourse();
  }, [route.params.courseId, navigation]);

  useEffect(() => {
    if (!course) return;
    const coursePath = course.path ?? [];

    let mounted = true;

    async function startWatching() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          if (coursePath.length > 0) {
            setCurrentLoc(coursePath[0]);
            setDistanceToRoute(0);
            setIsOffRoute(false);
          }
          Alert.alert('웹 테스트 모드', '위치 권한 없이 코스 미리보기 모드로 동작합니다.');
          return;
        }

        Alert.alert('권한 필요', '코스를 따라가려면 위치 권한이 필요합니다.');
        return;
      }

      watchSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 5,
        },
        (loc) => {
          if (!mounted) return;
          const point = { lat: loc.coords.latitude, lon: loc.coords.longitude };
          setCurrentLoc(point);

          if (coursePath.length > 0) {
            const dist = minDistanceToPathMeters(point, coursePath);
            setDistanceToRoute(dist);

            setIsOffRoute((prevOffRoute) => {
              if (!prevOffRoute && dist > OFF_ROUTE_THRESHOLD_METERS) {
                return true;
              } else if (prevOffRoute && dist < OFF_ROUTE_THRESHOLD_METERS - HYSTERESIS_METERS) {
                return false;
              }
              return prevOffRoute;
            });
          }

          if (followingMap && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: point.lat,
              longitude: point.lon,
              latitudeDelta: Platform.OS === 'web' ? 0 : 0.005,
              longitudeDelta: Platform.OS === 'web' ? 0 : 0.005,
            }, 500);
          }
        }
      );
    }

    startWatching();

    return () => {
      mounted = false;
      watchSubRef.current?.remove();
      watchSubRef.current = null;
    };
  }, [course, followingMap]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!course) {
    return null;
  }

  const pathCoords = (course.path || []).map((p) => ({
    latitude: p.lat,
    longitude: p.lon,
  }));

  useEffect(() => {
    if (!mapRef.current || pathCoords.length < 2) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates?.(pathCoords, {
        edgePadding: { top: 40, right: 40, bottom: 180, left: 40 },
        animated: false,
      });
    }, 80);
    return () => clearTimeout(t);
  }, [course?.id, pathCoords.length]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        onTouchStart={() => setFollowingMap(false)}
        initialRegion={
          pathCoords.length > 0
            ? {
                latitude: pathCoords[0].latitude,
                longitude: pathCoords[0].longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : undefined
        }
      >
        <Polyline coordinates={pathCoords} strokeWidth={5} strokeColor="#3b82f6" />
      </MapView>

      {pathCoords.length < 2 ? (
        <View style={styles.pathWarnBanner}>
          <Text style={styles.pathWarnText}>경로 데이터가 부족합니다. (백엔드 path 확인 필요)</Text>
        </View>
      ) : null}

      {!followingMap && (
        <Pressable
          style={styles.recenterBtn}
          onPress={() => {
            setFollowingMap(true);
            if (currentLoc && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: currentLoc.lat,
                longitude: currentLoc.lon,
                latitudeDelta: Platform.OS === 'web' ? 0 : 0.005,
                longitudeDelta: Platform.OS === 'web' ? 0 : 0.005,
              }, 400);
            }
          }}
        >
          <Text style={styles.recenterText}>현재 위치로</Text>
        </Pressable>
      )}

      {isOffRoute && (
        <View style={styles.offRouteBanner}>
          <Text style={styles.offRouteText}>⚠️ 코스를 벗어났어요</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{course.title}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.meta}>코스와 거리: {distanceToRoute != null ? Math.round(distanceToRoute) : '-'}m</Text>
          </View>
          <Text style={styles.meta}>경로 포인트: {pathCoords.length}개</Text>
          <Pressable style={styles.ghostButton} onPress={() => navigation.goBack()}>
            <Text style={styles.ghostButtonText}>따라가기 종료</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  map: { flex: 1 },
  overlay: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.xl },
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
  meta: { marginTop: spacing.xs, fontSize: typography.body, color: '#3a567f' },
  rowBetween: { marginTop: spacing.xs, flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  ghostButton: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#ffe9ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: { fontSize: typography.body, fontWeight: '800', color: colors.danger },
  recenterBtn: {
    position: 'absolute',
    bottom: 160,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    elevation: 4,
  },
  recenterText: { color: 'white', fontWeight: '800' },
  offRouteBanner: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.danger,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    elevation: 5,
  },
  offRouteText: {
    color: 'white',
    fontWeight: '900',
    fontSize: typography.body,
  },
  pathWarnBanner: {
    position: 'absolute',
    top: 72,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: '#fff3cd',
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#facc15',
  },
  pathWarnText: {
    color: '#7a5600',
    fontSize: typography.caption,
    fontWeight: '700',
    textAlign: 'center',
  },
});
