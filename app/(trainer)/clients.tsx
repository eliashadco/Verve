import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { useAuth } from '@/auth/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { useLinkedClients } from '@/hooks/useLinkedClients';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function TrainerClients() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { clients, loading, refresh } = useLinkedClients(profile?.id ?? null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 180);
    return () => clearTimeout(timeout);
  }, [query]);

  const filteredClients = useMemo(() => {
    if (!debouncedQuery) return clients;
    return clients.filter((client) => {
      const first = (client.first_name ?? '').toLowerCase();
      const last = (client.last_name ?? '').toLowerCase();
      const email = client.email.toLowerCase();
      return (
        first.includes(debouncedQuery) ||
        last.includes(debouncedQuery) ||
        `${first} ${last}`.trim().includes(debouncedQuery) ||
        email.includes(debouncedQuery)
      );
    });
  }, [clients, debouncedQuery]);

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Header title={t('screens.clientsTrainer.title')} />
      <Input
        label={t('trainerClients.searchLabel')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('trainerClients.searchPlaceholder')}
        placeholderTextColor={colors.textFaint}
      />

      {filteredClients.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="people-outline"
            title={clients.length === 0 ? t('trainerClients.emptyNoneTitle') : t('trainerClients.emptyNoMatchTitle')}
            body={
              clients.length === 0
                ? t('trainerClients.emptyNoneBody')
                : t('trainerClients.emptyNoMatchBody')
            }
          />
        </GlassCard>
      ) : (
        filteredClients.map((c) => {
          const fullName = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
          return (
            <Link key={c.id} href={`/(trainer)/client/${c.id}`} asChild>
              <Pressable>
                <GlassCard style={styles.row}>
                  <Avatar uri={c.avatar_url} name={fullName} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{fullName || c.email}</Text>
                    <Text style={styles.email}>{c.email}</Text>
                  </View>
                </GlassCard>
              </Pressable>
            </Link>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  email: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
});
