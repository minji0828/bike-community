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

import { useSettingsStore } from '../state/settingsStore';
import { getJson } from '../api/client';

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
      Alert.alert('OK', 'Backend is reachable.');
    } catch (e: any) {
      Alert.alert('Failed', String(e?.message ?? e));
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>API Base URL</Text>
        <TextInput
          value={apiBaseUrl}
          onChangeText={setApiBaseUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://10.0.2.2:8080"
          style={styles.input}
        />
        <Text style={styles.hint}>
          Android emulator uses `http://10.0.2.2:8080` for your local machine.
        </Text>
        <Pressable style={styles.button} onPress={testConnection} disabled={testing}>
          <Text style={styles.buttonText}>{testing ? 'Testing...' : 'Test connection'}</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nearby radius (meters)</Text>
        <TextInput
          value={String(nearbyRadiusMeters)}
          onChangeText={(t) => {
            const n = Number(t);
            if (Number.isFinite(n)) setNearbyRadiusMeters(Math.max(100, Math.min(5000, n)));
          }}
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Route radius (meters)</Text>
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
        <Text style={styles.label}>User ID (future)</Text>
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
          placeholder="(optional)"
        />
        <Text style={styles.hint}>
          Location endpoints require an existing user record in the backend.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Device UUID</Text>
        <Text style={styles.mono}>{deviceUuid ?? '(generating...)'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0b0f14',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#f5f7fb' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 12,
  },
  label: { fontSize: 13, fontWeight: '700', color: '#101827' },
  hint: { marginTop: 6, fontSize: 12, color: '#445066' },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d5dceb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#101827',
  },
  button: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1a2a44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  mono: {
    marginTop: 8,
    fontSize: 12,
    color: '#101827',
  },
});
