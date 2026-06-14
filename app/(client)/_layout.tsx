import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { UserTrialBottomNav } from '@/components/client/UserTrialBottomNav';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function ClientTabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: typography.family.bodyMedium,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderDefault,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
      }}
      tabBar={(props) => <UserTrialBottomNav {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.client.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          title: t('tabs.client.workout'),
          tabBarIcon: ({ color, size }) => <Ionicons name="journal-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.client.progress'),
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: t('tabs.client.live'),
          tabBarIcon: ({ color, size }) => <Ionicons name="radio" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: t('tabs.client.booking'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.client.messages'),
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.client.profile'),
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t('tabs.client.community'),
          href: null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="onboarding"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="training-hub"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="therapy"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="program/builder"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="program-builder"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
