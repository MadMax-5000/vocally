"use client";

import { useLocale } from "next-intl";

import ar from "@/messages/dashboard/deploy-sites-ar.json";
import en from "@/messages/dashboard/deploy-sites-en.json";
import fr from "@/messages/dashboard/deploy-sites-fr.json";

const messagesByLocale = { ar, en, fr };

export function useDeploySitesMessages() {
  const locale = useLocale();
  return messagesByLocale[locale as keyof typeof messagesByLocale]?.dashboard.deploy ?? en.dashboard.deploy;
}
