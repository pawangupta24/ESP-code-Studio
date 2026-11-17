import React, { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore, AppNotification, Severity } from '../stores/useWorkspaceStore';
import { Info, AlertTriangle, XCircle, X, BellOff, ChevronDown } from 'lucide-react';

const SEVERITY_ICON: Record<Severity, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-[#58a6ff] flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />,
  error: <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />,
};

const NotificationRow: React.FC<{ n: AppNotification; onClose: () => void }> = ({ n, onClose }) => {
  const [, actions] = useWorkspaceStore();
  return (
    <div className="px-3 py-2.5 text-xs text-[#c9d1d9] border-b border-[#30363d] last:border-b-0">
      <div className="flex items-start gap-2">
        {SEVERITY_ICON[n.severity]}
        <span className="flex-1 select-text leading-snug">{n.message}</span>
        <button onClick={onClose} title="Clear Notification" className="text-[#8b949e] hover:text-white">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {(n.source || n.actions?.length) && (
        <div className="flex items-center justify-between mt-2 pl-6">
          <span className="text-[10px] text-[#8b949e]">{n.source && `Source: ${n.source}`}</span>
          <div className="flex gap-1.5">
            {n.actions?.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  a.run();
                  actions.dismissNotification(n.id);
                }}
                className="px-2.5 py-0.5 rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white text-[11px]"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/** Toasts (bottom right) and the Notification Center opened from the status bar bell. */
export const Notifications: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const toasts = state.toastIds
    .map((id) => state.notifications.find((n) => n.id === id))
    .filter((n): n is AppNotification => !!n);

  if (state.isNotificationCenterOpen) {
    return (
      <div className="fixed right-3 bottom-8 w-[420px] max-w-[calc(100vw-24px)] bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl z-40 font-sans">
        <div className="h-8 px-3 flex items-center justify-between border-b border-[#30363d] text-[11px] uppercase tracking-wide text-[#8b949e]">
          <span>{state.notifications.length ? 'Notifications' : 'No New Notifications'}</span>
          <div className="flex gap-1">
            <button onClick={actions.clearNotifications} title="Clear All Notifications" className="p-1 hover:text-white">
              <BellOff className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => actions.setNotificationCenterOpen(false)} title="Hide Notifications" className="p-1 hover:text-white">
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {state.notifications.map((n) => (
            <NotificationRow key={n.id} n={n} onClose={() => actions.dismissNotification(n.id)} />
          ))}
        </div>
      </div>
    );
  }

  if (toasts.length === 0) return null;
  return (
    <div className="fixed right-3 bottom-8 w-[420px] max-w-[calc(100vw-24px)] flex flex-col gap-2 z-40 font-sans">
      {toasts.map((n) => (
        <div key={n.id} className="bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl">
          <NotificationRow n={n} onClose={() => actions.hideToast(n.id)} />
        </div>
      ))}
    </div>
  );
};

/** Modal message box (VS Code's "Do you want to save the changes...?" dialog). */
export const Dialog: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const d = state.dialog;
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!d) return;
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        actions.resolveDialog(d.cancelIndex);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [d]);

  if (!d) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-start justify-center pt-[15vh] font-sans" role="dialog" aria-modal="true">
      <div className="w-[460px] max-w-[calc(100vw-32px)] bg-[#161b22] border border-[#30363d] rounded-md shadow-2xl p-5">
        <div className="flex gap-3">
          <span className="mt-0.5">{SEVERITY_ICON[d.severity]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-semibold">{d.message}</p>
            {d.detail && <p className="text-xs text-[#8b949e] mt-2 whitespace-pre-line">{d.detail}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          {d.buttons.map((label, i) => (
            <button
              key={label}
              ref={i === 0 ? firstButton : undefined}
              onClick={() => actions.resolveDialog(i)}
              className={`px-3 py-1 rounded text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#58a6ff] ${
                i === 0 ? 'bg-[#1f6feb] hover:bg-[#388bfd] text-white' : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Quick input box at the top of the window (VS Code's showInputBox). */
export const InputBox: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const box = state.inputBox;
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!box) return;
    setValue(box.value);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      if (box.selectBaseName) {
        // Select "name" in "dir/name.ext" so typing replaces just the name
        const start = box.value.lastIndexOf('/') + 1;
        const dot = box.value.lastIndexOf('.');
        el.setSelectionRange(start, dot > start ? dot : box.value.length);
      } else {
        el.select();
      }
    });
  }, [box]);

  if (!box) return null;
  const error = box.validate?.(value) ?? null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-start justify-center pt-16"
      onMouseDown={(e) => e.target === e.currentTarget && actions.resolveInputBox(undefined)}
    >
      <div className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl p-2 font-sans">
        <input
          ref={inputRef}
          value={value}
          placeholder={box.placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !error) {
              e.preventDefault();
              actions.resolveInputBox(value);
            } else if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              actions.resolveInputBox(undefined);
            }
          }}
          className={`w-full bg-[#0d1117] border rounded px-2 py-1 text-xs text-white outline-none font-mono ${
            error ? 'border-rose-500' : 'border-[#30363d] focus:border-[#58a6ff]'
          }`}
        />
        <div className={`px-1 pt-1.5 text-[11px] ${error ? 'text-rose-400' : 'text-[#8b949e]'}`}>
          {error ?? `${box.prompt} (Press 'Enter' to confirm or 'Escape' to cancel)`}
        </div>
      </div>
    </div>
  );
};
