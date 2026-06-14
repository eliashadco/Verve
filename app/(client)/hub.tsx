import { ClientHubContent } from '@/components/client/ClientHubContent';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTranslation } from '@/lib/i18n';

export default function ClientHub() {
  const { t } = useTranslation();

  return (
    <ScreenContainer scroll={false}>
      <Header title={t('userTrial.hub.title')} />
      <ClientHubContent />
    </ScreenContainer>
  );
}
