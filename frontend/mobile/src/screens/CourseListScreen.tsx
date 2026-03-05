import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCourseDetail, getFeaturedCourses } from '../api/bikeoasis';
import RouteShapePreview from '../components/RouteShapePreview';
import { AppCard, AppChip, ScreenContainer } from '../components/ui';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors, spacing, typography } from '../theme/tokens';
import type { CourseSummary, PointDto } from '../types/bikeoasis';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Tabs'>;

function toKoreanVerifiedStatus(status?: string) {
  if (!status) return '';
  const normalized = status.toUpperCase();
  if (normalized === 'VERIFIED') return '검증됨';
  if (normalized === 'PENDING') return '검증 대기';
  if (normalized === 'UNVERIFIED') return '미검증';
  return status;
}

export default function CourseListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [previewPathById, setPreviewPathById] = useState<Record<number, PointDto[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFeaturedCourses();
      setCourses(data);
    } catch (e: any) {
      Alert.alert('조회 실패', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    if (courses.length === 0) return;

    const targets = courses.filter((c) => previewPathById[c.id] === undefined);
    if (targets.length === 0) return;

    let cancelled = false;

    (async () => {
      const resultEntries = await Promise.all(
        targets.map(async (course) => {
          try {
            if (course.pathPreview && course.pathPreview.length >= 2) {
              return [course.id, course.pathPreview] as const;
            }

            const detail = await getCourseDetail(course.id);
            return [course.id, detail.path] as const;
          } catch {
            return [course.id, [] as PointDto[]] as const;
          }
        })
      );

      if (cancelled) return;

      setPreviewPathById((prev) => {
        const next = { ...prev };
        resultEntries.forEach(([id, path]) => {
          next[id] = path;
        });
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [courses, previewPathById]);

  const pickPreviewPath = useCallback(
    (course: CourseSummary): PointDto[] => {
      const raw = previewPathById[course.id] ?? course.pathPreview ?? [];
      if (raw.length <= 200) return raw;
      const step = Math.ceil(raw.length / 200);
      return raw.filter((_, idx) => idx % step === 0);
    },
    [previewPathById]
  );

  const renderItem = ({ item }: { item: CourseSummary }) => (
    <Pressable onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}>
      <AppCard style={styles.card}>
        <RouteShapePreview points={pickPreviewPath(item)} height={104} lineColor="#1452e5" />
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.verifiedStatus ? (
            <AppChip text={toKoreanVerifiedStatus(item.verifiedStatus)} tone="success" />
          ) : null}
        </View>
        <View style={styles.row}>
          <Text style={styles.metaText}>{item.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.metaText}>{item.estimatedDurationMin}분</Text>
        </View>
        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tags.map((tag, idx) => (
              <AppChip key={idx} text={`#${tag}`} />
            ))}
          </View>
        ) : null}
      </AppCard>
    </Pressable>
  );

  return (
    <ScreenContainer style={styles.container}>
      {loading && courses.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 24 }} size="large" />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(c) => String(c.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchCourses} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>추천 코스가 없습니다.</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: typography.h2, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  metaText: { fontSize: typography.body, color: colors.textMuted, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 32 },
});
