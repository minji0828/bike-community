import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getCourseDetail } from '../api/bikeoasis';
import RouteShapePreview from '../components/RouteShapePreview';
import type { RootStackParamList } from '../navigation/RootStack';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { CourseDetail } from '../types/bikeoasis';

type DetailRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>;
type DetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourseDetail'>;

export default function CourseDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<DetailNavigationProp>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{course.title}</Text>
      <View style={styles.badges}>
        {course.tags?.map((tag, idx) => (
          <Text key={idx} style={styles.tag}>
            #{tag}
          </Text>
        ))}
      </View>
      <View style={styles.stats}>
        <Text style={styles.statItem}>거리: {course.distanceKm?.toFixed(1) || 0}km</Text>
        <Text style={styles.statItem}>예상 시간: {course.estimatedDurationMin || 0}분</Text>
        <Text style={styles.statItem}>화장실: {course.amenitiesSummary?.toiletCount || 0}개</Text>
        <Text style={styles.statItem}>{course.loop ? '순환 코스' : '편도 코스'}</Text>
      </View>

      {course.warnings && course.warnings.length > 0 ? (
        <View style={styles.warningsContainer}>
          <Text style={styles.warningsTitle}>주의 구간</Text>
          {course.warnings.map((w, idx) => (
            <Text key={idx} style={styles.warningText}>
              • {w.type} (위험도: {w.severity}) {w.note ? `- ${w.note}` : ''}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.mapContainer}>
        <RouteShapePreview points={course.path ?? []} height={260} showEndpoints lineColor="#1d4ed8" />
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={() => navigation.navigate('CourseFollow', { courseId: course.id })}
      >
        <Text style={styles.primaryButtonText}>코스 따라가기 시작</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    fontSize: typography.caption,
    color: colors.primaryDeep,
    backgroundColor: colors.softBlue,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  statItem: { fontSize: typography.body, color: colors.textMuted, fontWeight: '600' },
  warningsContainer: { backgroundColor: '#fff0f1', borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.sm },
  warningsTitle: { fontSize: typography.body, fontWeight: '800', color: colors.danger, marginBottom: spacing.xs },
  warningText: { fontSize: typography.caption, color: colors.danger, marginTop: 2 },
  mapContainer: { marginTop: spacing.sm },
  primaryButton: {
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: 32,
  },
  primaryButtonText: { fontSize: typography.body, fontWeight: '800', color: '#ffffff' },
});
