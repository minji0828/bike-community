import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CourseListScreen from '../screens/CourseListScreen';
import MapScreen from '../screens/MapScreen';
import RideScreen from '../screens/RideScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme/tokens';

export type RootTabParamList = {
  Map: undefined;
  Courses: undefined;
  Ride: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.bgElevated },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: '#163157' },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#89a0c1',
      }}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ title: '지도' }} />
      <Tab.Screen name="Courses" component={CourseListScreen} options={{ title: '코스' }} />
      <Tab.Screen name="Ride" component={RideScreen} options={{ title: '라이딩' }} />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: '설정' }}
      />
    </Tab.Navigator>
  );
}
