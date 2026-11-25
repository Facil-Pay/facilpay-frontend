'use client';

import type { DragEvent } from 'react';
import {
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_LAYOUT,
  type DashboardLayout,
  type DashboardWidgetId,
} from '@/lib/storage';

const WIDGET_LABELS: Record<DashboardWidgetId, string> = {
  gettingStarted: 'Getting started checklist',
  stats: 'Quick stats',
  paymentLink: 'Payment link',
  recentPayments: 'Recent payments',
  integrations: 'Developer settings links',
};

interface DashboardCustomizerProps {
  layout: DashboardLayout;
  onChange: (layout: DashboardLayout) => void;
  onToggleEditing: () => void;
}

export default function DashboardCustomizer({
  layout,
  onChange,
  onToggleEditing,
}: DashboardCustomizerProps) {
  const moveWidget = (source: DashboardWidgetId, target: DashboardWidgetId) => {
    if (source === target) return;
    const order = [...layout.order];
    const sourceIndex = order.indexOf(source);
    const targetIndex = order.indexOf(target);
    if (sourceIndex < 0 || targetIndex < 0) return;
    order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, source);
    onChange({ ...layout, order });
  };

  const handleDrop = (event: DragEvent<HTMLLIElement>, target: DashboardWidgetId) => {
    event.preventDefault();
    const source = event.dataTransfer.getData('text/plain') as DashboardWidgetId;
    if (DASHBOARD_WIDGETS.includes(source)) moveWidget(source, target);
  };

  const toggleWidget = (widget: DashboardWidgetId) => {
    const hidden = layout.hidden.includes(widget)
      ? layout.hidden.filter((item) => item !== widget)
      : [...layout.hidden, widget];
    onChange({ ...layout, hidden });
  };

  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Customize dashboard</h2>
          <p className="text-xs text-zinc-500">Drag to reorder, or use the move buttons.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_DASHBOARD_LAYOUT)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={onToggleEditing}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Done
          </button>
        </div>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {layout.order.map((widget, index) => {
          const isVisible = !layout.hidden.includes(widget);
          return (
            <li
              key={widget}
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/plain', widget)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, widget)}
              className="flex flex-wrap items-center justify-between gap-3 py-2"
            >
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                <span aria-hidden="true" className="mr-2 cursor-grab text-zinc-400">⠿</span>
                {WIDGET_LABELS[widget]}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveWidget(widget, layout.order[index - 1])}
                  aria-label={`Move ${WIDGET_LABELS[widget]} up`}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-zinc-700"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === layout.order.length - 1}
                  onClick={() => moveWidget(widget, layout.order[index + 1])}
                  aria-label={`Move ${WIDGET_LABELS[widget]} down`}
                  className="rounded border border-zinc-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-zinc-700"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => toggleWidget(widget)}
                  aria-pressed={isVisible}
                  className="min-w-16 rounded border border-zinc-200 px-2 py-1 text-xs font-medium dark:border-zinc-700"
                >
                  {isVisible ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
