"use client";

import { useEffect } from "react";

import { clearDraft } from "@/lib/registration-draft";

/** Rendered once a listing exists: the saved registration draft has done its job. */
export function ForgetRegistrationDraft() {
  useEffect(() => {
    clearDraft();
  }, []);
  return null;
}
