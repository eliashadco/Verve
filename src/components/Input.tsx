/**
 * Input — labeled text input matching the dark Verve aesthetic.
 */

import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps, ViewStyle } from 'react-native';

import { colors, radii, typography } from '@/lib/theme';

interface Props extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, helper, error, containerStyle, onFocus, onBlur, style, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          error && styles.inputWrapError,
        ]}
      >
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    color: colors.textSub,
    fontSize: typography.size.sm,
    fontFamily: typography.family.bodyMedium,
    letterSpacing: 0.3,
  },
  inputWrap: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputWrapFocused: { borderColor: colors.primary },
  inputWrapError: { borderColor: colors.danger },
  input: {
    color: colors.textMain,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    paddingVertical: 12,
  },
  helperText: { color: colors.textFaint, fontSize: typography.size.xs },
  errorText: { color: colors.danger, fontSize: typography.size.xs, fontFamily: typography.family.bodyMedium },
});
