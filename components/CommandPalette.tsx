/**
 * components/CommandPalette.tsx
 *
 * Global command palette component (Cmd+K) for navigation and quick actions.
 * Accessible via keyboard shortcut with search, filtering, and RBAC support.
 */

"use client";

import { useCommandPalette } from "@/lib/hooks/useCommandPalette";
import { Search, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface CommandPaletteProps {
  userRole?: string;
}

export function CommandPalette({ userRole }: CommandPaletteProps) {
  const { isOpen, search, selectedIndex, results, handleSearch, executeCommand, searchRef, toggle } =
    useCommandPalette(userRole);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const categoryLabels: Record<string, string> = {
    navigate: "Navigate",
    action: "Actions",
    record: "Records",
  };

  const groupedResults = results.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, typeof results>
  );

  return (
    <>
      {/* Command Palette Trigger Button */}
      <button
        onClick={toggle}
        aria-label="Open command palette"
        className="hidden md:flex gap-2 items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        title="Press Cmd+K"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto hidden sm:inline text-xs font-semibold text-gray-500">
          ⌘K
        </kbd>
      </button>

      {/* Palette Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 transition-all"
          onClick={() => toggle()}
          role="presentation"
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-palette-title"
          >
            {/* Search Input */}
            <div className="border-b border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search commands, pages, payments..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full rounded-lg border-none bg-gray-50 pl-10 pr-4 py-3 text-lg outline-none placeholder:text-gray-400"
                  autoFocus
                  id="command-palette-search"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500">
                  <Search className="h-6 w-6" />
                  <p>No commands found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              ) : (
                Object.entries(groupedResults).map(([category, commands]) => (
                  <div key={category}>
                    <div className="border-t border-gray-100 px-4 py-2 text-xs font-semibold uppercase text-gray-500">
                      {categoryLabels[category] || category}
                    </div>
                    {commands.map((cmd, idx) => {
                      const isSelected =
                        selectedIndex === results.indexOf(cmd);
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => executeCommand(results.indexOf(cmd))}
                          className={`w-full border-l-4 px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "border-l-blue-500 bg-blue-50"
                              : "border-l-transparent hover:bg-gray-50"
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  isSelected ? "text-blue-900" : "text-gray-900"
                                }`}
                              >
                                {cmd.label}
                              </p>
                              {cmd.description && (
                                <p className="mt-1 text-xs text-gray-600">
                                  {cmd.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500 flex justify-between">
              <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
              <span className="hidden sm:inline">Cmd+K to open</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
