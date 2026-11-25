'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { KEYBOARD_SHORTCUTS, type ShortcutArea } from '@/lib/keyboard-shortcuts';

const AREAS: ShortcutArea[] = ['navigation', 'lists', 'actions'];

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(
    target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
  );
}

export default function KeyboardShortcutsHelp() {
  const t = useTranslations('shortcuts');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const pendingNavigation = useRef(false);
  const sequenceTimeout = useRef<number | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || isTypingTarget(event.target)) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        pendingNavigation.current = false;
        if (sequenceTimeout.current !== null) window.clearTimeout(sequenceTimeout.current);
        return;
      }

      if (isOpen) return;

      if (event.key === '?') {
        event.preventDefault();
        pendingNavigation.current = false;
        if (sequenceTimeout.current !== null) window.clearTimeout(sequenceTimeout.current);
        setIsOpen(true);
        return;
      }

      if (pendingNavigation.current) {
        pendingNavigation.current = false;
        if (sequenceTimeout.current !== null) window.clearTimeout(sequenceTimeout.current);
        const shortcut = KEYBOARD_SHORTCUTS.find(
          (item) => item.href && item.keys[0] === 'G' && item.keys[1] === event.key.toUpperCase()
        );
        if (shortcut?.href) router.push(shortcut.href);
        return;
      }

      if (event.key.toLowerCase() === 'g') {
        pendingNavigation.current = true;
        sequenceTimeout.current = window.setTimeout(() => {
          pendingNavigation.current = false;
        }, 1000);
      } else if (event.key === '/') {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('[data-shortcut-search]:not([disabled])')?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeout.current !== null) window.clearTimeout(sequenceTimeout.current);
    };
  }, [isOpen, router]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        aria-describedby="keyboard-shortcuts-description"
        closeLabel={t('closeHelp')}
        className="max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description">
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {AREAS.map((area) => {
            const shortcuts = KEYBOARD_SHORTCUTS.filter((shortcut) => shortcut.area === area);
            return (
              <section key={area} aria-labelledby={`shortcut-area-${area}`}>
                <h3
                  id={`shortcut-area-${area}`}
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  {t(`area${area[0].toUpperCase()}${area.slice(1)}`)}
                </h3>
                <ul className="divide-y divide-border">
                  {shortcuts.map((shortcut) => (
                    <li
                      key={shortcut.id}
                      className="flex items-center justify-between gap-4 py-2 text-sm"
                    >
                      <span>{t(shortcut.translationKey)}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        {shortcut.keys.map((key, index) => (
                          <span key={`${key}-${index}`} className="flex items-center gap-1">
                            {index > 0 && <span className="text-muted">{t('then')}</span>}
                            <kbd className="rounded border border-border bg-muted/10 px-2 py-1 font-mono text-xs">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
