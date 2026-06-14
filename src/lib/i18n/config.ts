import { I18n } from 'i18n-js';

import en from './en.json';
import fr from './fr.json';

export const i18n = new I18n({ en, fr });

i18n.defaultLocale = 'en';
i18n.enableFallback = true;
