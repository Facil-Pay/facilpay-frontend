"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { BookmarkPlus, MoreHorizontal, Pencil, Star, StarOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";
import {
  MAX_CUSTOM_VIEWS,
  VIEW_NAME_MAX_LENGTH,
  validateViewName,
  type SavedView,
} from "@/lib/saved-views";

interface SavedViewsTabsProps {
  views: SavedView[];
  customViews: SavedView[];
  activeViewId: string | null;
  defaultViewId: string | null;
  canAddMore: boolean;
  /** id of the element the tabs filter, for aria-controls */
  controlsId: string;
  onSelect: (view: SavedView) => void;
  onSave: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string | null) => void;
}

type NameDialog = { mode: "create" } | { mode: "rename"; view: SavedView } | null;

export function SavedViewsTabs({
  views,
  customViews,
  activeViewId,
  defaultViewId,
  canAddMore,
  controlsId,
  onSelect,
  onSave,
  onRename,
  onDelete,
  onSetDefault,
}: SavedViewsTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [nameDialog, setNameDialog] = useState<NameDialog>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedView | null>(null);

  // Roving tabindex: the active tab (or the first one) is the tab stop.
  const focusIndex = Math.max(0, views.findIndex((v) => v.id === activeViewId));

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = views.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    tabRefs.current[next]?.focus();
    onSelect(views[next]);
  };

  const unsavedChanges = activeViewId === null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="tablist"
        aria-label="Saved payment views"
        className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 pb-1"
      >
        {views.map((view, index) => {
          const selected = view.id === activeViewId;
          const isDefault = view.id === defaultViewId;
          return (
            <div
              key={view.id}
              className={cn(
                "group flex shrink-0 items-center rounded-lg border text-xs font-medium transition-colors",
                selected
                  ? "border-[#000F24] bg-[#000F24] text-white dark:border-[#55C2FF] dark:bg-[#55C2FF] dark:text-black"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
              )}
            >
              <button
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`saved-view-tab-${view.id}`}
                aria-selected={selected}
                aria-controls={controlsId}
                tabIndex={index === focusIndex ? 0 : -1}
                onClick={() => onSelect(view)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1"
              >
                {isDefault && <Star className="h-3 w-3 fill-current" aria-hidden="true" />}
                <span className="max-w-[12rem] truncate">{view.name}</span>
                {isDefault && <span className="sr-only">(default view)</span>}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Options for ${view.name} view`}
                    className={cn(
                      "mr-1 rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                      selected ? "hover:bg-white/20" : "hover:bg-zinc-200 dark:hover:bg-zinc-700",
                    )}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {isDefault ? (
                    <DropdownMenuItem onSelect={() => onSetDefault(null)}>
                      <StarOff className="mr-2 h-4 w-4" aria-hidden="true" />
                      Remove as default
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => onSetDefault(view.id)}>
                      <Star className="mr-2 h-4 w-4" aria-hidden="true" />
                      Set as default
                    </DropdownMenuItem>
                  )}
                  {!view.builtIn && (
                    <>
                      <DropdownMenuItem onSelect={() => setNameDialog({ mode: "rename", view })}>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setPendingDelete(view)}
                        className="text-red-700 focus:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {unsavedChanges && (
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400" role="status">
            Unsaved filters
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          icon={<BookmarkPlus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setNameDialog({ mode: "create" })}
          disabled={!canAddMore}
          title={canAddMore ? undefined : `You can save up to ${MAX_CUSTOM_VIEWS} views`}
        >
          Save view
        </Button>
      </div>

      <ViewNameDialog
        key={nameDialog ? (nameDialog.mode === "rename" ? nameDialog.view.id : "create") : "closed"}
        state={nameDialog}
        customViews={customViews}
        onClose={() => setNameDialog(null)}
        onSubmit={(name) => {
          if (nameDialog?.mode === "rename") onRename(nameDialog.view.id, name);
          else onSave(name);
          setNameDialog(null);
        }}
      />

      <Dialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete view?</DialogTitle>
            <DialogDescription>
              “{pendingDelete?.name}” will be removed for this merchant. Your payments are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (pendingDelete) onDelete(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete view
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ViewNameDialog({
  state,
  customViews,
  onClose,
  onSubmit,
}: {
  state: NameDialog;
  customViews: SavedView[];
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const inputId = useId();
  const [name, setName] = useState(state?.mode === "rename" ? state.view.name : "");
  const [touched, setTouched] = useState(false);
  const ignoreId = state?.mode === "rename" ? state.view.id : undefined;
  const error = validateViewName(name, customViews, ignoreId);
  const isRename = state?.mode === "rename";

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form
          className="grid gap-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (!error) onSubmit(name);
          }}
        >
          <DialogHeader>
            <DialogTitle>{isRename ? "Rename view" : "Save current view"}</DialogTitle>
            <DialogDescription>
              {isRename
                ? "Give this view a new name."
                : "Saves the current search, filters and sort so you can reopen them in one click."}
            </DialogDescription>
          </DialogHeader>
          <Input
            id={inputId}
            label="View name"
            value={name}
            maxLength={VIEW_NAME_MAX_LENGTH + 10}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            error={touched && error ? error : undefined}
            helperText={`Up to ${VIEW_NAME_MAX_LENGTH} characters`}
            required
          />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{isRename ? "Rename" : "Save view"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
