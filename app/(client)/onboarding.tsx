import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { GlassCard } from '@/components/GlassCard';
import { VerveButton } from '@/components/VerveButton';
import { Input } from '@/components/Input';
import { useTranslation } from '@/lib/i18n';
import { colors, typography, radii, spacing, shadows } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { linkPractitionerByCode } from '@/hooks/useProfileMutations';

const ONBOARDING_TEXT = {
  en: {
    welcomeTitle: "Welcome to Verve",
    welcomeSubtitle: "Let's set up your profile to customize your training and recovery experience.",
    welcomeCta: "Get Started",
    
    biometricsTitle: "Basic Biometrics",
    biometricsSubtitle: "We use these metrics to tailor your movement protocols and track volume.",
    ageLabel: "Age",
    heightLabel: "Height (cm)",
    weightLabel: "Weight (kg)",
    genderLabel: "Gender (Optional)",
    nextStep: "Continue",
    prevStep: "Back",
    
    bodyTypeTitle: "What is your Body Type?",
    bodyTypeSubtitle: "Select the body type that closest matches your natural physical build.",
    ectomorphTitle: "Ectomorph",
    ectomorphDesc: "Lean and long, with difficulty building muscle. Naturally high metabolism.",
    mesomorphTitle: "Mesomorph",
    mesomorphDesc: "Muscular and well-built, with high metabolism. Easily builds muscle and loses fat.",
    endomorphTitle: "Endomorph",
    endomorphDesc: "Stocky structure, slower metabolism. Builds muscle well, but stores fat more easily.",
    
    pracTitle: "Link Your Practitioner",
    pracSubtitle: "If you are working with a physiotherapist or personal trainer, enter their link code below. This allows them to assign protocols and monitor your progress. You can skip this and link later.",
    pracLabel: "Practitioner Link Code",
    pracPlaceholder: "e.g. PRAC-1234",
    pracLinkBtn: "Link Practitioner",
    pracSkipBtn: "Skip for Now",
    pracLinkedMsg: "Successfully linked to ",
    completeBtn: "Finish Setup",
    
    saving: "Saving setup..."
  },
  fr: {
    welcomeTitle: "Bienvenue sur Verve",
    welcomeSubtitle: "Configurons votre profil pour personnaliser vos entraînements et votre récupération.",
    welcomeCta: "Commencer",
    
    biometricsTitle: "Données Biométriques",
    biometricsSubtitle: "Nous utilisons ces métriques pour adapter vos protocoles de mouvement.",
    ageLabel: "Âge",
    heightLabel: "Taille (cm)",
    weightLabel: "Poids (kg)",
    genderLabel: "Genre (Optionnel)",
    nextStep: "Continuer",
    prevStep: "Retour",
    
    bodyTypeTitle: "Quel est votre type corporel ?",
    bodyTypeSubtitle: "Sélectionnez le type corporel qui correspond le mieux à votre morphologie naturelle.",
    ectomorphTitle: "Ectomorphe",
    ectomorphDesc: "Mince et élancé, difficulté à prendre du muscle. Métabolisme naturellement élevé.",
    mesomorphTitle: "Mésomorphe",
    mesomorphDesc: "Musclé et bien proportionné, métabolisme élevé. Prends du muscle et perd du gras facilement.",
    endomorphTitle: "Endomorphe",
    endomorphDesc: "Structure trapue, métabolisme plus lent. Prends du muscle facilement, mais stocke le gras plus aisément.",
    
    pracTitle: "Associer un Praticien",
    pracSubtitle: "Si vous travaillez avec un kinésithérapeute ou un entraîneur, entrez son code d'association ci-dessous pour qu'il puisse vous prescrire des protocoles. Vous pouvez ignorer cette étape.",
    pracLabel: "Code d'association du Praticien",
    pracPlaceholder: "ex: PRAC-1234",
    pracLinkBtn: "Associer le Praticien",
    pracSkipBtn: "Ignorer pour l'instant",
    pracLinkedMsg: "Associé avec succès à ",
    completeBtn: "Terminer la configuration",
    
    saving: "Enregistrement..."
  }
};

type BodyType = 'Ectomorph' | 'Mesomorph' | 'Endomorph';

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const { locale } = useTranslation();
  
  // Choose text dictionary based on user's selected language
  const texts = ONBOARDING_TEXT[locale === 'fr' ? 'fr' : 'en'];

  const [step, setStep] = useState(0); // Steps: 0 = Welcome, 1 = Biometrics, 2 = Body Type, 3 = Practitioner
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  const [bodyType, setBodyType] = useState<BodyType>('Mesomorph');
  const [linkCode, setLinkCode] = useState('');
  const [linkedPracName, setLinkedPracName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Errors for Step 1
  const [ageError, setAgeError] = useState('');
  const [heightError, setHeightError] = useState('');
  const [weightError, setWeightError] = useState('');

  const validateBiometrics = () => {
    let valid = true;

    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setAgeError(locale === 'fr' ? 'Âge invalide (1-120)' : 'Invalid age (1-120)');
      valid = false;
    } else {
      setAgeError('');
    }

    const heightNum = parseFloat(height);
    if (!height || isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      setHeightError(locale === 'fr' ? 'Taille invalide (50-250 cm)' : 'Invalid height (50-250 cm)');
      valid = false;
    } else {
      setHeightError('');
    }

    const weightNum = parseFloat(weight);
    if (!weight || isNaN(weightNum) || weightNum < 20 || weightNum > 300) {
      setWeightError(locale === 'fr' ? 'Poids invalide (20-300 kg)' : 'Invalid weight (20-300 kg)');
      valid = false;
    } else {
      setWeightError('');
    }

    return valid;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateBiometrics()) return;
    }
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleLinkPractitioner = async () => {
    if (!profile?.id) return;
    setBusy(true);
    try {
      const result = await linkPractitionerByCode(profile.id, linkCode);
      setLinkedPracName(result.practitionerName);
      Alert.alert(
        locale === 'fr' ? 'Praticien associé' : 'Practitioner Linked',
        `${texts.pracLinkedMsg}${result.practitionerName}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Link failed';
      Alert.alert(locale === 'fr' ? 'Erreur d\'association' : 'Link Failed', message);
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    setBusy(true);
    try {
      const userId = profile?.id;
      // If we are logged in as a real user (not bypass mock user)
      if (userId && userId !== '00000000-0000-0000-0000-000000000001') {
        try {
          // 1. Update profiles table: onboarding_completed = true
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ onboarding_completed: true })
            .eq('id', userId);

          if (profileErr) throw profileErr;

          // 2. Upsert client_profiles table
          const birthYear = new Date().getFullYear() - parseInt(age, 10);
          const dob = `${birthYear}-01-01`;
          const { error: clientProfileErr } = await supabase
            .from('client_profiles')
            .upsert({
              user_id: userId,
              date_of_birth: dob,
              height_cm: parseFloat(height),
              weight_kg: parseFloat(weight),
              gender: gender || null,
              body_type: bodyType,
            });

          if (clientProfileErr) throw clientProfileErr;

          // Refresh user context so profile changes are reflected in local app state
          await refreshProfile();
        } catch (dbErr) {
          console.warn('[Verve] Supabase onboarding save failed:', dbErr);
        }
      }

      // 3. Set local onboarding state
      await AsyncStorage.setItem('verve_user_onboarded_v1', 'true');

      // 4. Redirect to main client app
      router.replace('/(client)/home');
    } catch (error) {
      console.error('[Verve] onboarding finish error', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              step === i && styles.dotActive,
              step > i && styles.dotCompleted,
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScreenContainer scroll={step !== 2} ambient="tealGlass">
        <View style={styles.header}>
          <Text style={styles.logo}>VERVE</Text>
          {renderDots()}
        </View>

        {step === 0 && (
          <GlassCard style={styles.card} padding={24}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles-sharp" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>{texts.welcomeTitle}</Text>
            <Text style={styles.subtitle}>{texts.welcomeSubtitle}</Text>
            <VerveButton
              label={texts.welcomeCta}
              onPress={() => setStep(1)}
              style={styles.ctaButton}
            />
          </GlassCard>
        )}

        {step === 1 && (
          <GlassCard style={styles.card} padding={24}>
            <Text style={styles.stepTitle}>{texts.biometricsTitle}</Text>
            <Text style={styles.stepSubtitle}>{texts.biometricsSubtitle}</Text>

            <View style={styles.form}>
              <Input
                label={texts.ageLabel}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="28"
                error={ageError}
              />
              <Input
                label={texts.heightLabel}
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="175"
                error={heightError}
              />
              <Input
                label={texts.weightLabel}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="72"
                error={weightError}
              />
              <Input
                label={texts.genderLabel}
                value={gender}
                onChangeText={setGender}
                placeholder="e.g. Female, Male"
              />
            </View>

            <View style={styles.buttonRow}>
              <VerveButton
                label={texts.prevStep}
                variant="ghost"
                onPress={handlePrev}
                style={styles.halfBtn}
              />
              <VerveButton
                label={texts.nextStep}
                onPress={handleNext}
                style={styles.halfBtn}
              />
            </View>
          </GlassCard>
        )}

        {step === 2 && (
          <GlassCard style={styles.card} padding={20}>
            <Text style={styles.stepTitle}>{texts.bodyTypeTitle}</Text>
            <Text style={styles.stepSubtitle}>{texts.bodyTypeSubtitle}</Text>

            <View style={styles.bodyTypesContainer}>
              {([
                { key: 'Ectomorph', title: texts.ectomorphTitle, desc: texts.ectomorphDesc, icon: 'body-outline' },
                { key: 'Mesomorph', title: texts.mesomorphTitle, desc: texts.mesomorphDesc, icon: 'barbell-outline' },
                { key: 'Endomorph', title: texts.endomorphTitle, desc: texts.endomorphDesc, icon: 'fitness-outline' },
              ] as const).map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => setBodyType(item.key)}
                  style={[
                    styles.bodyTypeItem,
                    bodyType === item.key && styles.bodyTypeItemActive,
                  ]}
                >
                  <View style={styles.bodyTypeIconRow}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={bodyType === item.key ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.bodyTypeItemTitle,
                        bodyType === item.key && styles.bodyTypeItemTitleActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {bodyType === item.key && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                        style={styles.checkmark}
                      />
                    )}
                  </View>
                  <Text style={styles.bodyTypeItemDesc}>{item.desc}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <VerveButton
                label={texts.prevStep}
                variant="ghost"
                onPress={handlePrev}
                style={styles.halfBtn}
              />
              <VerveButton
                label={texts.nextStep}
                onPress={handleNext}
                style={styles.halfBtn}
              />
            </View>
          </GlassCard>
        )}

        {step === 3 && (
          <GlassCard style={styles.card} padding={24}>
            <Text style={styles.stepTitle}>{texts.pracTitle}</Text>
            <Text style={styles.stepSubtitle}>{texts.pracSubtitle}</Text>

            <View style={styles.form}>
              <Input
                label={texts.pracLabel}
                value={linkCode}
                onChangeText={setLinkCode}
                placeholder={texts.pracPlaceholder}
                autoCapitalize="characters"
              />
              {linkedPracName && (
                <View style={styles.successMessage}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.successMessageText}>
                    {texts.pracLinkedMsg}{linkedPracName}
                  </Text>
                </View>
              )}
              {linkCode.length > 0 && !linkedPracName && (
                <VerveButton
                  label={texts.pracLinkBtn}
                  variant="ghost"
                  onPress={handleLinkPractitioner}
                  loading={busy}
                />
              )}
            </View>

            <View style={styles.buttonRow}>
              <VerveButton
                label={texts.prevStep}
                variant="ghost"
                onPress={handlePrev}
                disabled={busy}
                style={styles.halfBtn}
              />
              <VerveButton
                label={linkedPracName || linkCode.length === 0 ? texts.completeBtn : texts.pracSkipBtn}
                onPress={handleFinish}
                loading={busy}
                style={styles.halfBtn}
              />
            </View>
          </GlassCard>
        )}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  logo: {
    fontFamily: typography.family.headingExtra,
    fontSize: typography.size.xl,
    color: colors.primary,
    letterSpacing: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderDefault,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  dotCompleted: {
    backgroundColor: colors.primaryBorderStrong,
  },
  card: {
    gap: 16,
    ...shadows.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 12,
  },
  title: {
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    color: colors.textStrong,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  ctaButton: {
    marginTop: 12,
  },
  stepTitle: {
    fontFamily: typography.family.heading,
    fontSize: typography.size.xl,
    color: colors.textStrong,
  },
  stepSubtitle: {
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    color: colors.textMuted,
    lineHeight: 18,
  },
  form: {
    gap: 12,
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  halfBtn: {
    flex: 1,
  },
  bodyTypesContainer: {
    gap: 10,
    marginVertical: 10,
  },
  bodyTypeItem: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 12,
    gap: 4,
  },
  bodyTypeItemActive: {
    borderColor: colors.primaryBorderStrong,
    backgroundColor: colors.primaryDim,
  },
  bodyTypeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bodyTypeItemTitle: {
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
    color: colors.textSub,
  },
  bodyTypeItemTitleActive: {
    color: colors.primary,
  },
  bodyTypeItemDesc: {
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    color: colors.textMuted,
    lineHeight: 16,
    paddingLeft: 28,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successDim,
    padding: 10,
    borderRadius: radii.md,
    marginTop: 4,
  },
  successMessageText: {
    color: colors.success,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
});
