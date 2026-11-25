"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  CreditCard,
  LayoutGrid,
  LoaderCircle,
  RotateCcw,
  Search,
  User,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui/utils";
import { DASHBOARD_NAV_ITEMS } from "@/components/layout/nav-items";
import {
  MIN_LOOKUP_LENGTH,
  buildStaticCommands,
  filterCommands,
  lookupRecords,
  type CommandGroup,
  type PaletteCommand,
} from "@/lib/command-palette";
import { hasPermission } from "@/lib/permissions";
import { useCurrentMember } from "@/lib/team";

// ─── Context ──────────────────────────────────────────────────────────────────

interface CommandPaletteContextValue {
  open: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  return ctx;
}

/** Mounts the palette and binds Cmd/Ctrl+K for everything inside it. */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.key.toLowerCase() !== "k") return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      setIsOpen((open) => !open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ open: () => setIsOpen(true) }), []);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
    </CommandPaletteContext.Provider>
  );
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const GROUP_ORDER: CommandGroup[] = ["navigation", "actions", "payments", "refunds", "customers"];

const GROUP_META: Record<CommandGroup, { title: string; icon: LucideIcon }> = {
  navigation: { title: "Pages", icon: LayoutGrid },
  actions: { title: "Quick actions", icon: Zap },
  payments: { title: "Payments", icon: CreditCard },
  refunds: { title: "Refunds", icon: RotateCcw },
  customers: { title: "Customers", icon: User },
};

const LOOKUP_DEBOUNCE_MS = 200;

type LookupState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "done"; query: string; commands: PaletteCommand[]; partial: boolean }
  | { status: "error"; query: string };

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 flex max-h-[70vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          {/* Remount on open so every session starts with an empty query. */}
          {open && <PaletteBody onClose={() => onOpenChange(false)} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const tNav = useTranslations("navigation");
  const member = useCurrentMember();
  const role = member?.status === "active" ? member.role : null;
  const listId = useId();
  const optionPrefix = useId();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });

  const staticCommands = useMemo(
    () => buildStaticCommands(DASHBOARD_NAV_ITEMS, role, (label) => tNav(label)),
    [role, tNav],
  );

  // Debounced API lookup; stale requests are aborted.
  const trimmed = query.trim();
  // Record lookup needs read access to payments.
  const shouldLookup = trimmed.length >= MIN_LOOKUP_LENGTH && hasPermission(role, "payments:view");
  useEffect(() => {
    if (!shouldLookup) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLookup({ status: "loading", query: trimmed });
      lookupRecords(trimmed, controller.signal)
        .then((result) =>
          setLookup({
            status: result.failed.length === 2 ? "error" : "done",
            query: trimmed,
            commands: result.commands,
            partial: result.failed.length === 1,
          }),
        )
        .catch((error: unknown) => {
          if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
          setLookup({ status: "error", query: trimmed });
        });
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed, shouldLookup]);

  const lookupCurrent = shouldLookup && lookup.status !== "idle" && lookup.query === trimmed;
  const recordCommands = useMemo(
    () => (lookupCurrent && lookup.status === "done" ? lookup.commands : []),
    [lookupCurrent, lookup],
  );
  const isSearching = shouldLookup && (!lookupCurrent || lookup.status === "loading");

  const results = useMemo(() => {
    const matched = [...filterCommands(staticCommands, query), ...recordCommands];
    return GROUP_ORDER.flatMap((group) => matched.filter((c) => c.group === group));
  }, [staticCommands, query, recordCommands]);

  const safeIndex = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1);
  const activeId = safeIndex >= 0 ? `${optionPrefix}-${safeIndex}` : undefined;

  useEffect(() => {
    if (!activeId) return;
    document.getElementById(activeId)?.scrollIntoView?.({ block: "nearest" });
  }, [activeId]);

  const run = useCallback(
    (command: PaletteCommand) => {
      onClose();
      router.push(command.href);
    },
    [onClose, router],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    const last = results.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(safeIndex >= last ? 0 : safeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(safeIndex <= 0 ? last : safeIndex - 1);
    } else if (event.key === "Home" && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(last);
    } else if (event.key === "Enter" && safeIndex >= 0) {
      event.preventDefault();
      run(results[safeIndex]);
    }
  };

  let statusMessage = `${results.length} result${results.length === 1 ? "" : "s"}`;
  if (isSearching) statusMessage = "Searching payments, refunds and customers…";
  else if (lookupCurrent && lookup.status === "error") statusMessage = "Record search is unavailable right now.";

  // Option ids follow the flat result order so arrow keys and DOM agree.
  const indexById = new Map(results.map((command, index) => [command.id, index]));

  return (
    <>
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-700">
        <Search className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          aria-label="Search pages, actions and records"
          placeholder="Search pages, or look up an ID, hash, email or address…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
        />
        {isSearching && <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-zinc-500" aria-hidden="true" />}
        <kbd className="hidden shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 sm:inline dark:border-zinc-600 dark:text-zinc-300">
          Esc
        </kbd>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>

      <div id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
        {GROUP_ORDER.map((group) => {
          const items = results.filter((c) => c.group === group);
          if (items.length === 0) return null;
          const { title, icon: Icon } = GROUP_META[group];
          const headingId = `${listId}-${group}`;
          return (
            <div key={group} role="group" aria-labelledby={headingId} className="mb-2 last:mb-0">
              <div id={headingId} className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                {title}
              </div>
              {items.map((command) => {
                const index = indexById.get(command.id) ?? -1;
                const selected = index === safeIndex;
                return (
                  <div
                    key={command.id}
                    id={`${optionPrefix}-${index}`}
                    role="option"
                    aria-selected={selected}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => run(command)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm",
                      selected ? "bg-sky-50 text-sky-950 dark:bg-sky-950/60 dark:text-sky-50" : "text-zinc-800 dark:text-zinc-200",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{command.label}</span>
                      {command.hint && (
                        <span className="block truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                          {command.hint}
                        </span>
                      )}
                    </span>
                    {selected && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  </div>
                );
              })}
            </div>
          );
        })}

        {results.length === 0 && !isSearching && (
          <div className="px-3 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {trimmed ? <>No results for “{trimmed}”.</> : "Type to search."}
          </div>
        )}

        {lookupCurrent && lookup.status === "error" && (
          <p className="px-3 py-2 text-xs text-red-700 dark:text-red-400">
            Couldn’t search payments and refunds. Check your connection and try again.
          </p>
        )}
        {lookupCurrent && lookup.status === "done" && lookup.partial && (
          <p className="px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            Some records couldn’t be searched, so results may be incomplete.
          </p>
        )}
        {shouldLookup === false && trimmed.length > 0 && trimmed.length < MIN_LOOKUP_LENGTH && (
          <p className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400">
            Type at least {MIN_LOOKUP_LENGTH} characters to look up records.
          </p>
        )}
      </div>

      <div className="hidden items-center gap-4 border-t border-zinc-200 px-4 py-2 text-[11px] text-zinc-600 sm:flex dark:border-zinc-700 dark:text-zinc-400">
        <span><kbd className="font-sans">↑↓</kbd> to move</span>
        <span><kbd className="font-sans">Enter</kbd> to open</span>
        <span><kbd className="font-sans">Esc</kbd> to close</span>
      </div>
    </>
  );
}
