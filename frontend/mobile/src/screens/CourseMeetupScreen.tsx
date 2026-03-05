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
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootStack';
import {
  createCourseMeetup,
  joinCourseMeetup,
  leaveCourseMeetup,
  listCourseMeetups,
} from '../api/bikeoasis';
import { MeetupChatClient } from '../api/meetupChat';
import { AppButton, AppCard } from '../components/ui';
import { useSettingsStore } from '../state/settingsStore';
import { colors, spacing, typography } from '../theme/tokens';
import type { CourseMeetup, MeetupChatMessage } from '../types/bikeoasis';

type MeetupRoute = RouteProp<RootStackParamList, 'CourseMeetup'>;

function formatStartAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR');
}

export default function CourseMeetupScreen() {
  const route = useRoute<MeetupRoute>();
  const accessToken = useSettingsStore((s) => s.accessToken);
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);

  const [loading, setLoading] = useState(false);
  const [meetups, setMeetups] = useState<CourseMeetup[]>([]);
  const [selectedMeetupId, setSelectedMeetupId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MeetupChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [capacity, setCapacity] = useState('');

  const chatClientRef = useRef<MeetupChatClient | null>(null);

  const selectedMeetup = useMemo(
    () => meetups.find((m) => m.meetupId === selectedMeetupId) ?? null,
    [meetups, selectedMeetupId]
  );

  const fetchMeetups = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listCourseMeetups(route.params.courseId);
      setMeetups(rows);
      if (!selectedMeetupId && rows.length > 0) {
        setSelectedMeetupId(rows[0].meetupId);
      }
    } catch (e: any) {
      Alert.alert('모임 조회 실패', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [route.params.courseId, selectedMeetupId]);

  useEffect(() => {
    fetchMeetups();
  }, [fetchMeetups]);

  useEffect(() => {
    if (!selectedMeetupId || !accessToken) {
      chatClientRef.current?.disconnect();
      chatClientRef.current = null;
      setMessages([]);
      return;
    }

    chatClientRef.current?.disconnect();
    const client = new MeetupChatClient({
      meetupId: selectedMeetupId,
      apiBaseUrl,
      token: accessToken,
      handlers: {
        onMessage: (message) => {
          setMessages((prev) => [...prev, message]);
        },
        onHistory: (history) => {
          setMessages(history);
        },
        onError: (msg) => Alert.alert('채팅 오류', msg),
      },
    });
    chatClientRef.current = client;
    client.connect();
    const timer = setTimeout(() => client.requestHistory(), 400);

    return () => {
      clearTimeout(timer);
      client.disconnect();
      if (chatClientRef.current === client) {
        chatClientRef.current = null;
      }
    };
  }, [accessToken, apiBaseUrl, selectedMeetupId]);

  const handleCreateMeetup = useCallback(async () => {
    if (!accessToken) {
      Alert.alert('인증 필요', '설정 화면에서 먼저 로그인해 주세요.');
      return;
    }
    if (!title.trim() || !startAt.trim()) {
      Alert.alert('입력 필요', '제목과 시작시각(ISO)을 입력해 주세요.');
      return;
    }

    setCreating(true);
    try {
      const meetupId = await createCourseMeetup(route.params.courseId, {
        title: title.trim(),
        startAt: startAt.trim(),
        capacity: capacity.trim() ? Number(capacity.trim()) : undefined,
      });
      setTitle('');
      setCapacity('');
      await fetchMeetups();
      setSelectedMeetupId(meetupId);
    } catch (e: any) {
      Alert.alert('모임 생성 실패', String(e?.message ?? e));
    } finally {
      setCreating(false);
    }
  }, [accessToken, capacity, fetchMeetups, route.params.courseId, startAt, title]);

  const handleJoinLeave = useCallback(async () => {
    if (!selectedMeetup) return;
    if (!accessToken) {
      Alert.alert('인증 필요', '설정 화면에서 먼저 로그인해 주세요.');
      return;
    }
    try {
      if (selectedMeetup.joined) {
        await leaveCourseMeetup(selectedMeetup.meetupId);
      } else {
        await joinCourseMeetup(selectedMeetup.meetupId);
      }
      await fetchMeetups();
    } catch (e: any) {
      Alert.alert('모임 처리 실패', String(e?.message ?? e));
    }
  }, [accessToken, fetchMeetups, selectedMeetup]);

  const sendMessage = useCallback(() => {
    const body = chatInput.trim();
    if (!body) return;
    chatClientRef.current?.send(body);
    setChatInput('');
  }, [chatInput]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>코스 모임/채팅</Text>

      <AppCard>
        <Text style={styles.sectionTitle}>모임 생성</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="모임 제목"
          style={styles.input}
        />
        <TextInput
          value={startAt}
          onChangeText={setStartAt}
          placeholder="시작시각 ISO (예: 2026-03-07T09:00:00)"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={capacity}
          onChangeText={setCapacity}
          placeholder="정원(선택)"
          style={styles.input}
          keyboardType="numeric"
        />
        <AppButton
          label={creating ? '생성 중...' : '모임 생성'}
          onPress={handleCreateMeetup}
          disabled={creating}
          full
        />
      </AppCard>

      <AppCard>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>모임 목록</Text>
          <AppButton label="새로고침" variant="ghost" onPress={fetchMeetups} />
        </View>
        {loading ? <ActivityIndicator style={{ marginTop: spacing.sm }} /> : null}
        {meetups.map((meetup) => (
          <View key={meetup.meetupId} style={styles.meetupItem}>
            <Text style={styles.meetupTitle}>{meetup.title}</Text>
            <Text style={styles.meta}>
              시작: {formatStartAt(meetup.startAt)} / 인원: {meetup.participantCount}
              {meetup.capacity ? `/${meetup.capacity}` : ''}
            </Text>
            <View style={styles.row}>
              <AppButton
                label={selectedMeetupId === meetup.meetupId ? '선택됨' : '선택'}
                variant="secondary"
                onPress={() => setSelectedMeetupId(meetup.meetupId)}
                disabled={selectedMeetupId === meetup.meetupId}
              />
              <AppButton
                label={meetup.joined ? '나가기' : '참여'}
                variant={meetup.joined ? 'danger' : 'ghost'}
                onPress={handleJoinLeave}
                disabled={selectedMeetupId !== meetup.meetupId}
              />
            </View>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={styles.sectionTitle}>채팅</Text>
        <Text style={styles.meta}>
          {selectedMeetup ? `선택된 모임 #${selectedMeetup.meetupId}` : '모임을 선택하세요'}
        </Text>
        <View style={styles.chatBox}>
          {messages.length === 0 ? (
            <Text style={styles.meta}>메시지가 없습니다.</Text>
          ) : (
            messages.map((message) => (
              <View key={message.messageId} style={styles.messageItem}>
                <Text style={styles.messageAuthor}>{message.authorDisplayName}</Text>
                <Text style={styles.messageBody}>{message.body}</Text>
              </View>
            ))
          )}
        </View>
        <TextInput
          value={chatInput}
          onChangeText={setChatInput}
          placeholder="메시지 입력 (최대 200자)"
          style={styles.input}
          maxLength={200}
        />
        <AppButton
          label="메시지 전송"
          onPress={sendMessage}
          disabled={!selectedMeetup || !accessToken}
          full
        />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 24, fontWeight: '900', color: colors.ink },
  sectionTitle: { fontSize: typography.body, fontWeight: '800', color: colors.ink },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: colors.ink,
    fontSize: typography.body,
  },
  meetupItem: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    gap: spacing.xs,
  },
  meetupTitle: { fontSize: typography.body, fontWeight: '700', color: colors.ink },
  meta: { fontSize: typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  chatBox: {
    marginTop: spacing.sm,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: '#fff',
  },
  messageItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: spacing.xs,
  },
  messageAuthor: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  messageBody: { fontSize: typography.body, color: colors.ink, marginTop: 2 },
});
