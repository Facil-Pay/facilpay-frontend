/**
 * lib/hooks/useCommandPalette.ts
 *
 * Hook for global command palette with keyboard shortcuts and search.
 * Supports navigation, record lookup, and quick actions with RBAC filtering.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: "navigate" | "action" | "record";
  icon?: string;
  keybinding?: string;
  action: () => void | Promise<void>;
  requiresRole?: string[];
  searchTerms?: string[];
}

interface CommandPaletteState {
  isOpen: boolean;
  search: string;
  selectedIndex: number;
  results: CommandItem[];
}

const BUILT_IN_COMMANDS: CommandItem[] = [
  {
    id: "nav-dashboard",
    label: "Dashboard",
    category: "navigate",
    icon: "home",
    action: () => window.location.href = "/",
    searchTerms: ["home", "overview"],
  },
  {
    id: "nav-payments",
    label: "Payments",
    category: "navigate",
    icon: "credit-card",
    action: () => window.location.href = "/payments",
    searchTerms: ["transactions", "list"],
  },
  {
    id: "nav-refunds",
    label: "Refunds",
    category: "navigate",
    icon: "undo",
    action: () => window.location.href = "/refunds",
    searchTerms: ["returns"],
  },
  {
    id: "nav-payouts",
    label: "Payouts",
    category: "navigate",
    icon: "send",
    action: () => window.location.href = "/payouts",
    searchTerms: ["withdrawals", "settlements"],
  },
  {
    id: "nav-api-keys",
    label: "API Keys",
    category: "navigate",
    icon: "key",
    action: () => window.location.href = "/api-keys",
    searchTerms: ["integration", "developer"],
  },
  {
    id: "action-new-payment",
    label: "Create Payment Link",
    description: "Generate a new payment request",
    category: "action",
    icon: "plus",
    action: () => {
      const modal = document.getElementById("new-payment-modal");
      if (modal) modal.setAttribute("data-open", "true");
    },
    searchTerms: ["new", "create", "link"],
  },
  {
    id: "action-new-payout",
    label: "New Payout",
    description: "Initiate a settlement",
    category: "action",
    icon: "plus",
    action: () => {
      const modal = document.getElementById("new-payout-modal");
      if (modal) modal.setAttribute("data-open", "true");
    },
    searchTerms: ["settlement", "withdrawal"],
  },
  {
    id: "action-api-key",
    label: "Create API Key",
    description: "Generate new API credentials",
    category: "action",
    icon: "plus",
    action: () => {
      const modal = document.getElementById("new-api-key-modal");
      if (modal) modal.setAttribute("data-open", "true");
    },
    searchTerms: ["new", "create", "key"],
  },
];

export function useCommandPalette(userRole?: string) {
  const [state, setState] = useState<CommandPaletteState>({
    isOpen: false,
    search: "",
    selectedIndex: 0,
    results: BUILT_IN_COMMANDS,
  });

  const [customCommands, setCustomCommands] = useState<CommandItem[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  // Register custom commands (from RBAC or other sources)
  const registerCommand = useCallback((command: CommandItem) => {
    setCustomCommands((prev) => [...prev, command]);
  }, []);

  // Filter commands by role and search
  const filterCommands = useCallback(
    (search: string, commands: CommandItem[]) => {
      const allCommands = [...BUILT_IN_COMMANDS, ...customCommands, ...commands];
      const filtered = allCommands.filter((cmd) => {
        if (cmd.requiresRole && !cmd.requiresRole.includes(userRole || "")) {
          return false;
        }
        if (!search) return true;

        const searchLower = search.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchLower) ||
          cmd.description?.toLowerCase().includes(searchLower) ||
          cmd.searchTerms?.some((t) => t.toLowerCase().includes(searchLower))
        );
      });

      return filtered;
    },
    [customCommands, userRole]
  );

  // Handle search
  const handleSearch = useCallback((value: string) => {
    const results = filterCommands(value, []);
    setState((prev) => ({
      ...prev,
      search: value,
      results,
      selectedIndex: 0,
    }));
  }, [filterCommands]);

  // Open/close palette
  const toggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      search: "",
      selectedIndex: 0,
      results: filterCommands("", []),
    }));
  }, [filterCommands]);

  // Execute selected command
  const executeCommand = useCallback(async (index: number) => {
    const cmd = state.results[index];
    if (!cmd) return;

    setState((prev) => ({ ...prev, isOpen: false }));
    try {
      await cmd.action();
    } catch (error) {
      console.error("Command failed:", error);
    }
  }, [state.results]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
        setTimeout(() => searchRef.current?.focus(), 0);
      }

      if (!state.isOpen) return;

      switch (e.key) {
        case "Escape":
          setState((prev) => ({ ...prev, isOpen: false }));
          break;
        case "ArrowDown":
          e.preventDefault();
          setState((prev) => ({
            ...prev,
            selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1),
          }));
          break;
        case "ArrowUp":
          e.preventDefault();
          setState((prev) => ({
            ...prev,
            selectedIndex: Math.max(prev.selectedIndex - 1, 0),
          }));
          break;
        case "Enter":
          e.preventDefault();
          executeCommand(state.selectedIndex);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, state.selectedIndex, state.results, toggle, executeCommand]);

  return {
    ...state,
    toggle,
    handleSearch,
    executeCommand,
    registerCommand,
    searchRef,
  };
}
