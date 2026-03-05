import { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { AppButton, AppCard, ScreenContainer } from '../components/ui';
import { loginWithKakao, syncToilets } from '../api/bikeoasis';
import { useSettingsStore } from '../state/settingsStore';
import { getJson } from '../api/client';
import { colors, spacing, typography } from '../theme/tokens';

export default function SettingsScreen() {
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl);
  const adminApiKey = useSettingsStore((s) => s.adminApiKey);
  const setAdminApiKey = useSettingsStore((s) => s.setAdminApiKey);
  const nearbyRadiusMeters = useSettingsStore((s) => s.nearbyRadiusMeters);
  const setNearbyRadiusMeters = useSettingsStore((s) => s.setNearbyRadiusMeters);
  const routeRadiusMeters = useSettingsStore((s) => s.routeRadiusMeters);
  const setRouteRadiusMeters = useSettingsStore((s) => s.setRouteRadiusMeters);
  const deviceUuid = useSettingsStore((s) => s.deviceUuid);
  const accessToken = useSettingsStore((s) => s.accessToken);
  const setAccessToken = useSettingsStore((s) => s.setAccessToken);
  const userId = useSettingsStore((s) => s.userId);
  const setUserId = useSettingsStore((s) => s.setUserId);

  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState<'none' | 'auto' | 'incremental' | 'full'>('none');
  const [exchanging, setExchanging] = useState(false);
  const [kakaoCode, setKakaoCode] = useState('');
  const [kakaoCodeVerifier, setKakaoCodeVerifier] = useState('');
  const [kakaoRedirectUri, setKakaoRedirectUri] = useState('');
  const [kakaoNonce, setKakaoNonce] = useState('');

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

  const clearToken = () => {
    setAccessToken(null);
    Alert.alert('완료', '인증 토큰을 삭제했습니다.');
  };

  const exchangeKakao = async () => {
    if (!kakaoCode.trim() || !kakaoCodeVerifier.trim() || !kakaoRedirectUri.trim()) {
      Alert.alert('입력 필요', 'code, codeVerifier, redirectUri를 입력해 주세요.');
      return;
    }

    setExchanging(true);
    try {
      const token = await loginWithKakao({
        code: kakaoCode.trim(),
        codeVerifier: kakaoCodeVerifier.trim(),
        redirectUri: kakaoRedirectUri.trim(),
        nonce: kakaoNonce.trim() || undefined,
      });
      setAccessToken(token.accessToken);
      Alert.alert('로그인 성공', `토큰이 저장되었습니다. (만료 ${token.expiresInSec}초)`);
    } catch (e: any) {
      Alert.alert('로그인 실패', String(e?.message ?? e));
    } finally {
      setExchanging(false);
    }
  };

  const triggerToiletSync = async (mode: 'auto' | 'incremental' | 'full') => {
    setSyncing(mode);
    try {
      const message = await syncToilets(mode, adminApiKey);
      Alert.alert('동기화 완료', message);
    } catch (e: any) {
      Alert.alert('동기화 실패', String(e?.message ?? e));
    } finally {
      setSyncing('none');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>설정</Text>

      <AppCard>
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
        <Text style={[styles.label, { marginTop: spacing.md }]}>관리자 API 키 (선택)</Text>
        <TextInput
          value={adminApiKey}
          onChangeText={setAdminApiKey}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="X-Admin-Key"
          style={styles.input}
        />
        <AppButton
          style={{ marginTop: spacing.sm }}
          onPress={testConnection}
          disabled={testing}
          label={testing ? '연결 확인 중...' : '연결 테스트'}
          full
        />
      </AppCard>

      <AppCard>
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
      </AppCard>

      <AppCard>
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
      </AppCard>

      <AppCard>
        <Text style={styles.label}>기기 UUID</Text>
        <Text style={styles.mono}>{deviceUuid ?? '(생성 중...)'}</Text>
        {deviceUuid ? (
          <AppButton
            style={{ marginTop: spacing.sm }}
            variant="ghost"
            onPress={copyUuid}
            label="UUID 복사"
            full
          />
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={styles.label}>화장실 데이터 동기화 (백엔드)</Text>
        <Text style={styles.hint}>백엔드의 POI 동기화 API를 호출합니다.</Text>
        <AppButton
          style={{ marginTop: spacing.sm }}
          onPress={() => triggerToiletSync('auto')}
          disabled={syncing !== 'none'}
          label={syncing === 'auto' ? '자동 동기화 중...' : '자동 동기화'}
          full
        />
        <View style={styles.inlineRow}>
          <AppButton
            variant="ghost"
            onPress={() => triggerToiletSync('incremental')}
            disabled={syncing !== 'none'}
            label={syncing === 'incremental' ? '증분 동기화 중...' : '증분'}
            full
          />
          <AppButton
            variant="danger"
            onPress={() => triggerToiletSync('full')}
            disabled={syncing !== 'none'}
            label={syncing === 'full' ? '전체 동기화 중...' : '전체 새로고침'}
            full
          />
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.label}>카카오 로그인 코드 교환 (MVP2)</Text>
        <TextInput
          value={kakaoCode}
          onChangeText={setKakaoCode}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="authorization code"
          style={styles.input}
        />
        <TextInput
          value={kakaoCodeVerifier}
          onChangeText={setKakaoCodeVerifier}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="code verifier"
          style={styles.input}
        />
        <TextInput
          value={kakaoRedirectUri}
          onChangeText={setKakaoRedirectUri}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="redirect uri"
          style={styles.input}
        />
        <TextInput
          value={kakaoNonce}
          onChangeText={setKakaoNonce}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="nonce (선택)"
          style={styles.input}
        />
        <AppButton
          style={{ marginTop: spacing.sm }}
          onPress={exchangeKakao}
          disabled={exchanging}
          label={exchanging ? '교환 중...' : '카카오 코드 교환'}
          full
        />
      </AppCard>

      <AppCard>
        <Text style={styles.label}>인증 토큰 (댓글 작성용)</Text>
        <Text style={styles.mono}>{accessToken ? `${accessToken.slice(0, 32)}...` : '(없음)'}</Text>
        <Text style={styles.hint}>댓글 작성/삭제/신고 요청 시 Authorization 헤더로 자동 전송됩니다.</Text>
        <AppButton
          style={{ marginTop: spacing.sm }}
          variant="danger"
          onPress={clearToken}
          label="토큰 삭제"
          full
          disabled={!accessToken}
        />
      </AppCard>
    </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: 'transparent',
    gap: spacing.md,
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.ink },
  label: { fontSize: typography.caption, fontWeight: '800', color: colors.ink },
  hint: { marginTop: spacing.xs, fontSize: typography.caption, color: colors.textMuted },
  input: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.body,
    backgroundColor: '#ffffff',
    color: colors.ink,
  },
  mono: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.ink,
    lineHeight: 16,
  },
  inlineRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
