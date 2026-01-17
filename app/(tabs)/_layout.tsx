import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" } // hides bottom tabs completely
      }}
    >
      <Tabs.Screen name="chat" />
    </Tabs>
  );
}
