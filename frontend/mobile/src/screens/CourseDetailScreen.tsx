import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  createCourseComment,
  deleteCourseComment,
  getCourseDetail,
  listCourseComments,
  reportCourseComment,
} from '../api/bikeoasis';
import MapView, { Marker, Polyline, Region } from '../components/MapWrapper';
import { AppButton, AppCard, AppChip } from '../components/ui';
import type { RootStackParamList } from '../navigation/RootStack';
import { useSettingsStore } from '../state/settingsStore';
import { colors, radius, spacing, typography } from '../theme/tokens';
import type { CourseComment, CourseDetail } from '../types/bikeoasis';

type DetailRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>;
type DetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourseDetail'>;

function formatKoreanDate(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CourseDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<DetailNavigationProp>();
  const mapRef = useRef<any | null>(null);
  const accessToken = useSettingsStore((s) => s.accessToken);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState<CourseComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const rows = await listCourseComments(route.params.courseId, { limit: 20 });
      setComments(rows);
    } catch (e: any) {
      Alert.alert('댓글 조회 실패', String(e?.message ?? e));
    } finally {
      setCommentsLoading(false);
    }
  }, [route.params.courseId]);

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
    fetchComments();
  }, [fetchComments]);

  const pathCoords = useMemo(
    () =>
      (course?.path ?? []).map((p) => ({
        latitude: p.lat,
        longitude: p.lon,
      })),
    [course?.path]
  );

  const initialRegion: Region | undefined =
    pathCoords.length > 0
      ? {
          latitude: pathCoords[0].latitude,
          longitude: pathCoords[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : undefined;

  useEffect(() => {
    if (!mapRef.current || pathCoords.length < 2) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates?.(pathCoords, {
        edgePadding: { top: 24, right: 24, bottom: 24, left: 24 },
        animated: false,
      });
    }, 100);
    return () => clearTimeout(t);
  }, [pathCoords]);

  const submitComment = useCallback(async () => {
    if (!accessToken) {
      Alert.alert('인증 필요', '설정 화면에서 카카오 로그인(코드 교환) 후 댓글 작성이 가능합니다.');
      return;
    }
    const body = commentBody.trim();
    if (!body) {
      Alert.alert('입력 필요', '댓글 내용을 입력해 주세요.');
      return;
    }

    setSubmittingComment(true);
    try {
      await createCourseComment(route.params.courseId, body);
      setCommentBody('');
      await fetchComments();
    } catch (e: any) {
      Alert.alert('댓글 작성 실패', String(e?.message ?? e));
    } finally {
      setSubmittingComment(false);
    }
  }, [accessToken, commentBody, fetchComments, route.params.courseId]);

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      if (!accessToken) {
        Alert.alert('인증 필요', '인증 토큰이 필요합니다.');
        return;
      }
      try {
        await deleteCourseComment(commentId);
        await fetchComments();
      } catch (e: any) {
        Alert.alert('댓글 삭제 실패', String(e?.message ?? e));
      }
    },
    [accessToken, fetchComments]
  );

  const handleReportComment = useCallback(
    async (commentId: number) => {
      if (!accessToken) {
        Alert.alert('인증 필요', '설정 화면에서 로그인 후 신고할 수 있습니다.');
        return;
      }
      try {
        await reportCourseComment(commentId, {
          reason: 'spam',
          note: '앱 내 신고',
        });
        Alert.alert('신고 완료', '신고가 접수되었습니다.');
      } catch (e: any) {
        Alert.alert('신고 실패', String(e?.message ?? e));
      }
    },
    [accessToken]
  );

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
          <AppChip key={idx} text={`#${tag}`} />
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
        {initialRegion ? (
          <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
            <Polyline coordinates={pathCoords} strokeWidth={5} strokeColor="#1452e5" />
            {pathCoords.length > 0 ? (
              <Marker coordinate={pathCoords[0]} title="출발" pinColor="#16a34a" />
            ) : null}
            {pathCoords.length > 1 ? (
              <Marker
                coordinate={pathCoords[pathCoords.length - 1]}
                title="도착"
                pinColor="#dc2626"
              />
            ) : null}
          </MapView>
        ) : (
          <View style={styles.emptyMap}>
            <Text style={styles.emptyMapText}>코스 경로 데이터가 없습니다.</Text>
          </View>
        )}
      </View>

      <AppButton
        style={styles.followBtn}
        onPress={() => navigation.navigate('CourseFollow', { courseId: course.id })}
        label="코스 따라가기 시작"
        full
      />

      <AppCard>
        <View style={styles.commentHeader}>
          <Text style={styles.commentTitle}>댓글</Text>
          <AppButton
            variant="ghost"
            onPress={fetchComments}
            label="새로고침"
            style={styles.refreshBtn}
          />
        </View>

        <TextInput
          value={commentBody}
          onChangeText={setCommentBody}
          placeholder={accessToken ? '코스 후기를 남겨보세요' : '설정에서 로그인 후 댓글 작성 가능'}
          multiline
          style={styles.commentInput}
          editable={!submittingComment}
        />

        <AppButton
          onPress={submitComment}
          label={submittingComment ? '작성 중...' : '댓글 작성'}
          disabled={submittingComment || !accessToken}
          full
          style={styles.submitBtn}
        />

        {commentsLoading ? <ActivityIndicator style={{ marginTop: spacing.sm }} /> : null}

        {comments.length === 0 && !commentsLoading ? (
          <Text style={styles.emptyComment}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</Text>
        ) : null}

        {comments.map((comment) => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.commentTopRow}>
              <Text style={styles.commentAuthor}>{comment.author.displayName}</Text>
              <Text style={styles.commentDate}>{formatKoreanDate(comment.createdAt)}</Text>
            </View>
            <Text style={styles.commentBody}>{comment.body}</Text>
            <View style={styles.commentActionRow}>
              {comment.isMine ? (
                <AppButton
                  variant="danger"
                  label="삭제"
                  onPress={() => handleDeleteComment(comment.id)}
                  style={styles.commentActionBtn}
                />
              ) : (
                <AppButton
                  variant="ghost"
                  label="신고"
                  onPress={() => handleReportComment(comment.id)}
                  style={styles.commentActionBtn}
                  disabled={!accessToken}
                />
              )}
            </View>
          </View>
        ))}
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  statItem: { fontSize: typography.body, color: colors.textMuted, fontWeight: '600' },
  warningsContainer: {
    backgroundColor: '#fff0f1',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  warningsTitle: {
    fontSize: typography.body,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: spacing.xs,
  },
  warningText: { fontSize: typography.caption, color: colors.danger, marginTop: 2 },
  mapContainer: {
    marginTop: spacing.sm,
    height: 260,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
  emptyMap: {
    flex: 1,
    backgroundColor: '#edf4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMapText: {
    color: colors.textMuted,
    fontSize: typography.caption,
    fontWeight: '700',
  },
  followBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentTitle: {
    fontSize: typography.h3,
    fontWeight: '800',
    color: colors.ink,
  },
  refreshBtn: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  commentInput: {
    marginTop: spacing.sm,
    minHeight: 84,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.body,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  emptyComment: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    color: colors.textMuted,
  },
  commentItem: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: {
    fontSize: typography.caption,
    fontWeight: '800',
    color: colors.ink,
  },
  commentDate: {
    fontSize: typography.tiny,
    color: colors.textMuted,
  },
  commentBody: {
    marginTop: spacing.xs,
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 21,
  },
  commentActionRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  commentActionBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
  },
});
