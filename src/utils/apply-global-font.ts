import { Platform, Text } from 'react-native';
import { Fonts } from '@/constants/theme';

let isApplied = false;

/**
 * Injects Google Sans as the default font on native platforms.
 * On web, typography cascades cleanly through src/global.css without JS DOM interference.
 */
export function applyGlobalFont(): void {
  if (isApplied) return;
  isApplied = true;

  // Web typography is handled natively and cleanly by src/global.css
  if (Platform.OS === 'web') {
    return;
  }

  const fontName = Fonts?.sans ?? 'GoogleSans_400Regular';
  const textComponent = Text as any;

  if (textComponent) {
    try {
      if (!textComponent.defaultProps) {
        textComponent.defaultProps = {};
      }
      textComponent.defaultProps.style = [
        { fontFamily: fontName },
        textComponent.defaultProps.style,
      ];
    } catch {
      // Ignored if object is frozen in certain environments
    }
  }
}
