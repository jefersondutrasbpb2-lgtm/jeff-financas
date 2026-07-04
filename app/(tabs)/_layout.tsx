import { Tabs } from 'expo-router';
import { ResponsiveTabBar } from '../../components/layout/ResponsiveTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <ResponsiveTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="budget" />
      <Tabs.Screen name="investments" />
      <Tabs.Screen name="credit-cards" />
    </Tabs>
  );
}
