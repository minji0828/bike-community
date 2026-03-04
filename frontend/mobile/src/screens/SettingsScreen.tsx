import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { useSettingsStore } from '../state/settingsStore';
import { getJson } from '../api/client';
import { colors, radius, spacing, typography } from '../theme/tokens';

export default function SettingsScreen() {
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl);
  const nearbyRadiusMeters = useSettingsStore((s) => s.nearbyRadiusMeters);
  const setNearbyRadiusMeters = useSettingsStore((s) => s.setNearbyRadiusMeters);
  const routeRadiusMeters = useSettingsStore((s) => s.routeRadiusMeters);
  const setRouteRadiusMeters = useSettingsStore((s) => s.setRouteRadiusMeters);
  const deviceUuid = useSettingsStore((s) => s.deviceUuid);
  const userId = useSettingsStore((s) => s.userId);
  const setUserId = useSettingsStore((s) => s.setUserId);

  const [testing, setTesting] = useState(false);

  const userIdText = useMemo(() => (userId === null ? '' : String(userId)), [userId]);

  const testConnection = async () => {
    setTesting(true);
    try {
      // SpringDoc default endpoint.
      await getJson<any>('/v3/api-docs');
      Alert.alert('연결 성공', '백엔드에 정상적으로 연결됩니다.');
    } catch (e: any) {
      Alert.alert('연결 실패', String(e?.message ?? e));
    } finally {
      setTesting(false);
    }
  };

  const copyUuid = async () => {
    if (deviceUuid) {
      await Clipboard.setStringAsync(deviceUuid);
      Alert.alert('복사 완료', 'Device UUID를 클립보드에 복사했습니다.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>설정</Text>

      <View style={styles.card}>
        <Text style={styles.label}>API 서버 주소</Text>
        <TextInput
          value={apiBaseUrl}
          onChangeText={setApiBaseUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://10.0.2.2:8080"
          style={styles.input}
        />
        <Text style={styles.hint}>
          Android 에뮬레이터는 로컬 서버 접속 시 `http://10.0.2.2:8080`을 사용합니다.
        </Text>
        <Pressable style={styles.button} onPress={testConnection} disabled={testing}>
          <Text style={styles.buttonText}>{testing ? '연결 확인 중...' : '연결 테스트'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>주변 검색 반경 (m)</Text>
        <TextInput
          value={String(nearbyRadiusMeters)}
          onChangeText={(t) => {
            const n = Number(t);
            if (Number.isFinite(n)) setNearbyRadiusMeters(Math.max(100, Math.min(5000, n)));
          }}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>경로 검색 반경 (m)</Text>
        <TextInput
          value={String(routeRadiusMeters)}
          onChangeText={(t) => {
            const n = Number(t);
            if (Number.isFinite(n)) setRouteRadiusMeters(Math.max(10, Math.min(1000, n)));
          }}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>사용자 ID (추후 기능)</Text>
        <TextInput
          value={userIdText}
          onChangeText={(t) => {
            const trimmed = t.trim();
            if (!trimmed) {
              setUserId(null);
              return;
            }
            const n = Number(trimmed);
            if (Number.isFinite(n)) setUserId(n);
          }}
          keyboardType="numeric"
          style={styles.input}
          placeholder="(선택 입력)"
        />
        <Text style={styles.hint}>
          위치 API를 사용하려면 백엔드에 등록된 userId가 필요합니다.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>기기 UUID</Text>
        <Text style={styles.mono}>{deviceUuid ?? '(생성 중...)'}</Text>
        {deviceUuid ? (
          <Pressable style={styles.ghostButton} onPress={copyUuid}>
            <Text style={styles.ghostButtonText}>UUID 복사</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  label: { fontSize: typography.caption, fontWeight: '800', color: colors.ink },
  hint: { marginTop: spacing.xs, fontSize: typography.caption, color: '#3b557d' },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.body,
    backgroundColor: '#ffffff',
    color: colors.ink,
  },
  button: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: typography.body, fontWeight: '800' },
  ghostButton: {
    marginTop: spacing.sm,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: { color: colors.primaryDeep, fontSize: typography.body, fontWeight: '800' },
  mono: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    color: colors.ink,
  },
});
