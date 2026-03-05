import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootTabs } from './RootTabs';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import CourseFollowScreen from '../screens/CourseFollowScreen';
import { colors } from '../theme/tokens';

export type RootStackParamList = {
  Tabs: undefined;
  CourseDetail: { courseId: number };
  CourseFollow: { courseId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
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
    </Stack.Navigator>
  );
}
