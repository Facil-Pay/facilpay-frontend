/**
 * components/payments/SavedViewsTabs.tsx
 *
 * Tab UI for saved payment list views.
 * Displays built-in views, custom saved views, and actions to manage them.
 */

"use client";

import { useState } from "react";
import { useSavedViews, type SavedView } from "@/lib/hooks/useSavedViews";
import { ChevronDown, Trash2, Settings, Plus } from "lucide-react";

interface SavedViewsTabsProps {
  merchantId: string;
  currentViewId: string;
  onViewChange: (viewId: string) => void;
  onSaveCurrentView?: (name: string) => void;
}

export function SavedViewsTabs({
  merchantId,
  currentViewId,
  onViewChange,
  onSaveCurrentView,
}: SavedViewsTabsProps) {
  const { views, isLoaded, saveView, deleteView, setDefault, updateView } =
    useSavedViews(merchantId);
  const [showNewViewForm, setShowNewViewForm] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showMenu, setShowMenu] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex gap-2 border-b border-gray-200 py-3 px-4">
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  const handleSaveNewView = () => {
    if (!newViewName.trim() || !onSaveCurrentView) return;
    onSaveCurrentView(newViewName);
    setNewViewName("");
    setShowNewViewForm(false);
  };

  const handleRenameView = (viewId: string) => {
    if (!editingName.trim()) return;
    updateView(viewId, { name: editingName });
    setEditingViewId(null);
    setEditingName("");
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex gap-2 overflow-x-auto px-4 py-3">
        {views.map((view) => (
          <div key={view.id} className="relative">
            <button
              onClick={() => onViewChange(view.id)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                currentViewId === view.id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title={view.description}
            >
              {view.name}
            </button>

            {!["all", "pending", "failed", "refunded"].includes(view.id) && (
              <div className="relative inline-block">
                <button
                  onClick={() => setShowMenu(showMenu === view.id ? null : view.id)}
                  className="ml-1 rounded p-1 hover:bg-gray-200"
                  aria-label={`Menu for ${view.name}`}
                >
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showMenu === view.id && (
                  <div className="absolute right-0 mt-1 w-48 rounded-md border border-gray-300 bg-white shadow-lg z-10">
                    <button
                      onClick={() => {
                        setEditingViewId(view.id);
                        setEditingName(view.name);
                        setShowMenu(null);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      <Settings className="mr-2 inline h-4 w-4" />
                      Rename
                    </button>
                    <button
                      onClick={() => {
                        setDefault(view.id);
                        setShowMenu(null);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      ★ Set as default
                    </button>
                    <button
                      onClick={() => {
                        deleteView(view.id);
                        setShowMenu(null);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 inline h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {editingViewId === view.id && (
              <div className="absolute top-0 left-0 mt-10 p-2 bg-white border rounded shadow-lg z-20">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="New view name"
                  className="mb-2 block w-full rounded border px-2 py-1 text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRenameView(view.id)}
                    className="flex-1 rounded bg-blue-500 px-2 py-1 text-sm text-white hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingViewId(null)}
                    className="flex-1 rounded bg-gray-300 px-2 py-1 text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {onSaveCurrentView && (
          <button
            onClick={() => setShowNewViewForm(!showNewViewForm)}
            className="whitespace-nowrap rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <Plus className="inline h-4 w-4 mr-1" />
            Save view
          </button>
        )}

        {showNewViewForm && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name..."
              className="rounded border px-2 py-1 text-sm"
              autoFocus
            />
            <button
              onClick={handleSaveNewView}
              className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowNewViewForm(false);
                setNewViewName("");
              }}
              className="rounded bg-gray-300 px-3 py-1 text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
