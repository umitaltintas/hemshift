import React from 'react';

interface ActionMessageProps {
  message: { type: 'success' | 'error'; text: string } | null;
}

export const ActionMessage: React.FC<ActionMessageProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${
        message.type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-rose-200 bg-rose-50 text-rose-700'
      }`}
    >
      {message.text}
    </div>
  );
};
