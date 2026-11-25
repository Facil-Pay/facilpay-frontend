export type ShortcutArea = 'navigation' | 'lists' | 'actions';

export interface KeyboardShortcut {
  id: string;
  area: ShortcutArea;
  keys: string[];
  translationKey: string;
  href?: string;
  action?: 'focusSearch' | 'openHelp' | 'closeHelp';
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { id: 'overview', area: 'navigation', keys: ['G', 'O'], translationKey: 'goOverview', href: '/overview' },
  { id: 'payments', area: 'navigation', keys: ['G', 'P'], translationKey: 'goPayments', href: '/payments' },
  { id: 'developers', area: 'navigation', keys: ['G', 'D'], translationKey: 'goDevelopers', href: '/developers/api-keys' },
  { id: 'webhooks', area: 'navigation', keys: ['G', 'W'], translationKey: 'goWebhooks', href: '/webhooks' },
  { id: 'focusSearch', area: 'lists', keys: ['/'], translationKey: 'focusSearch', action: 'focusSearch' },
  { id: 'openHelp', area: 'actions', keys: ['?'], translationKey: 'openHelp', action: 'openHelp' },
  { id: 'closeHelp', area: 'actions', keys: ['Esc'], translationKey: 'closeHelp', action: 'closeHelp' },
];
