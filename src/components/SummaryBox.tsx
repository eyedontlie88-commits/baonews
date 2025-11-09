import React from "react";

export function SummaryBox({ content, onRefresh }: { content?: string | null; onRefresh?: () => Promise<void> | void }) {
  return (
    <div className="rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-amber-900">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">🧠 Tóm tắt AI</div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="rounded-md bg-amber-600/90 px-2 py-1 text-xs text-white hover:bg-amber-700"
          >
            Làm mới
          </button>
        )}
      </div>
      {content ? (
        <p className="whitespace-pre-line text-sm leading-relaxed">{content}</p>
      ) : (
        <p className="text-sm italic opacity-70">Chưa có tóm tắt — hãy bấm "Tóm tắt AI".</p>
      )}
    </div>
  );
}
