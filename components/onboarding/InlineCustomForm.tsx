"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type InlineCustomFormProps = {
  id: string;
  label: string;
  placeholder: string;
  helper: string;
  value: string;
  onChange: (val: string) => void;
  onContinue: () => void;
};

export function InlineCustomForm({
  id,
  label,
  placeholder,
  helper,
  value,
  onChange,
  onContinue,
}: InlineCustomFormProps) {
  const disabled = value.trim().length === 0;

  return (
    <div className="rounded-xl border border-hairline bg-surface-card p-4 mt-6">
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={120}
        />
        <p className="text-caption text-muted">{helper}</p>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={disabled}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
