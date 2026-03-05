import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootTabs } from './RootTabs';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import CourseFollowScreen from '../screens/CourseFollowScreen';
import CourseMeetupScreen from '../screens/CourseMeetupScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useSettingsStore } from '../state/settingsStore';
import { colors } from '../theme/tokens';
import { ActivityIndicator, View } from 'react-native';

export type RootStackParamList = {
  Auth: undefined;
  Tabs: undefined;
  CourseDetail: { courseId: number };
  CourseFollow: { courseId: number };
  CourseMeetup: { courseId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  const hasHydrated = useSettingsStore((s) => s.hasHydrated);
  const accessToken = useSettingsStore((s) => s.accessToken);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!accessToken) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.bgElevated },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="Auth"
          component={SettingsScreen}
          options={{ title: '로그인 필요', headerTitleAlign: 'center' }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgElevated },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen 
        name="Tabs" 
        component={RootTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="CourseDetail" 
        component={CourseDetailScreen} 
        options={{ title: '코스 상세', headerTitleAlign: 'center' }} 
      />
      <Stack.Screen 
        name="CourseFollow" 
        component={CourseFollowScreen} 
        options={{ title: '코스 따라가기', headerTitleAlign: 'center' }} 
      />
      <Stack.Screen
        name="CourseMeetup"
        component={CourseMeetupScreen}
        options={{ title: '코스 모임/채팅', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}
