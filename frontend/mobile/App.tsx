import 'react-native-gesture-handler';

import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootStack } from './src/navigation/RootStack';
import { useSettingsStore } from './src/state/settingsStore';

export default function App() {
  const hasHydrated = useSettingsStore((s) => s.hasHydrated);
  const ensureDeviceUuid = useSettingsStore((s) => s.ensureDeviceUuid);

  useEffect(() => {
    if (!hasHydrated) return;
    ensureDeviceUuid().catch(() => {
      // Best-effort: the app can still run without it, but ride upload will be blocked.
    });
  }, [hasHydrated, ensureDeviceUuid]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
