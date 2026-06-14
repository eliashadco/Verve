import { Fragment } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { useTrainerLinkedConstraintsRealtime } from '@/hooks/useTrainerLinkedConstraintsRealtime';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

function TrainerConstraintChannels() {
  const { profile } = useAuth();
  useTrainerLinkedConstraintsRealtime(profile?.role === 'trainer' ? profile.id : null);
  return null;
}

export default function TrainerTabsLayout() {
  const { t } = useTranslation();
  return (
    <Fragment>
      <TrainerConstraintChannels />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontFamily: typography.family.bodyMedium, fontSize: 11 },
          tabBarStyle: {
            backgroundColor: colors.bgSurface,
            borderTopColor: colors.borderDefault,
            borderTopWidth: 1,
            height: 64,
            paddingTop: 8,
            paddingBottom: 8,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('tabs.trainer.home'),
            tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="clients"
          options={{
            title: t('tabs.trainer.clients'),
            tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="client/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="programs"
          options={{
            title: t('tabs.trainer.programs'),
            tabBarIcon: ({ color, size }) => <Ionicons name="barbell" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="program/[id]"
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
          name="bookings"
          options={{
            title: t('tabs.trainer.bookings'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('tabs.trainer.messages'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.trainer.profile'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </Fragment>
  );
}
