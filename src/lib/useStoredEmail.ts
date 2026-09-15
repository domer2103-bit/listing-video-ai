"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "lva_email";
// localStorage's own "storage" event only fires in *other* tabs — this
// custom event covers the same-tab case (setEmail firing right after the
// user submits the EmailGate) so useSyncExternalStore re-renders here too.
const CHANGE_EVENT = "lva-email-changed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

/** Trust-based identity: no password, no verification — just remembers
 * whatever email the user typed once, in localStorage, so the free
 * generation / subscription quota has someone to check against on
 * repeat visits without asking again. */
export function useStoredEmail() {
  const email = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function setEmail(value: string) {
    localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return { email, setEmail, loaded: true };
}
