"use client";

import { useState } from "react";

export function EmailGate({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <form
      className="space-y-3 rounded-lg border border-neutral-200 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.includes("@")) onSubmit(value.trim());
      }}
    >
      <label className="block text-sm font-medium text-neutral-900">What&apos;s your email?</label>
      <p className="text-sm text-neutral-500">
        Used to track your free video and any subscription — no password needed.
      </p>
      <div className="flex gap-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white"
        >
          Continue
        </button>
      </div>
    </form>
  );
}
