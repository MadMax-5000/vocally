"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const COMPANY_SIZE_VALUES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

type CompanySize = (typeof COMPANY_SIZE_VALUES)[number];

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  companySize: CompanySize | "";
  message: string;
  website: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  company: "",
  phone: "",
  companySize: "",
  message: "",
  website: "",
};

export function EnterpriseContactForm() {
  const t = useTranslations("contact.sales.form");
  const locale = useLocale();
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, locale }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !json.success) {
        toast.error(json.error ?? t("error"));
        return;
      }

      toast.success(t("success"));
      setForm(initialState);
    } catch {
      toast.error(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sales-name">{t("name")}</Label>
          <Input
            id="sales-name"
            name="name"
            required
            autoComplete="name"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder={t("namePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sales-email">{t("email")}</Label>
          <Input
            id="sales-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder={t("emailPlaceholder")}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sales-company">{t("company")}</Label>
          <Input
            id="sales-company"
            name="company"
            required
            autoComplete="organization"
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            placeholder={t("companyPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sales-phone">{t("phone")}</Label>
          <Input
            id="sales-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder={t("phonePlaceholder")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sales-company-size">{t("companySize")}</Label>
        <select
          id="sales-company-size"
          name="companySize"
          value={form.companySize}
          onChange={(event) => updateField("companySize", event.target.value as CompanySize | "")}
          className="flex h-10 w-full rounded-md border border-hairline-strong bg-surface-card px-3 py-2 text-body-md text-ink focus-visible:border-muted-soft focus-visible:outline-none"
        >
          <option value="">{t("companySizePlaceholder")}</option>
          {COMPANY_SIZE_VALUES.map((value) => (
            <option key={value} value={value}>
              {t(`companySizeOptions.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sales-message">{t("message")}</Label>
        <Textarea
          id="sales-message"
          name="message"
          required
          rows={5}
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          placeholder={t("messagePlaceholder")}
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <Label htmlFor="sales-website">Website</Label>
        <Input
          id="sales-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => updateField("website", event.target.value)}
        />
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
