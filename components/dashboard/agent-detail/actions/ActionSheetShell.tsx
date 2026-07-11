"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/** Input styles aligned with the agent detail page. */
export const actionSheetInputClass =
  "h-10 w-full rounded-md border border-hairline bg-surface-card text-body-sm text-ink shadow-none placeholder:text-muted-soft focus-visible:border-hairline-strong focus-visible:ring-1 focus-visible:ring-hairline-strong/10";

export const actionSheetTextareaClass =
  "min-h-[88px] w-full resize-y rounded-md border border-hairline bg-surface-card text-body-sm text-ink shadow-none focus-visible:border-hairline-strong focus-visible:ring-1 focus-visible:ring-hairline-strong/10";

type ActionSheetShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  size?: "default" | "wide";
  pending?: boolean;
  isDirty?: boolean;
  saveDisabled?: boolean;
  onSave: () => void;
  children: React.ReactNode;
};

export function ActionSheetShell({
  open,
  onOpenChange,
  title,
  description,
  size = "default",
  pending = false,
  isDirty = true,
  saveDisabled = false,
  onSave,
  children,
}: ActionSheetShellProps) {
  const t = useTranslations("dashboard.actions");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          "flex w-full flex-col gap-0 bg-canvas p-0",
          size === "wide" ? "sm:max-w-lg" : "sm:max-w-md",
        )}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <SheetHeader className="space-y-1 border-b border-hairline px-5 pb-4 pt-5 text-left">
          <SheetTitle className="font-display text-display-sm font-normal tracking-tight text-ink">
            {title}
          </SheetTitle>
          <SheetDescription className="text-body-sm text-muted">
            {description}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
          {children}
        </div>

        <SheetFooter className="gap-2 border-t border-hairline bg-canvas px-5 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-hairline bg-surface-card text-body-sm font-medium text-ink shadow-none hover:bg-canvas-soft"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-8 bg-primary text-body-sm font-medium text-on-primary shadow-none hover:bg-primary-active"
            onClick={onSave}
            disabled={pending || !isDirty || saveDisabled}
          >
            {pending ? t("saving") : t("save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type ActionSheetSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function ActionSheetSection({
  title,
  description,
  children,
  className,
}: ActionSheetSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div>
        <h3 className="text-title-sm text-ink">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-body-sm text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type ActionSheetFieldProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function ActionSheetField({
  label,
  description,
  children,
  className,
}: ActionSheetFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-body-sm text-muted">{label}</span>
      {description ? (
        <p className="-mt-0.5 text-caption text-muted-soft">{description}</p>
      ) : null}
      {children}
    </div>
  );
}

type ActionSheetToggleRowProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function ActionSheetToggleRow({
  label,
  description,
  children,
  className,
}: ActionSheetToggleRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-2", className)}>
      <div className="min-w-0 flex-1">
        <span className="text-body-sm text-ink">{label}</span>
        {description ? (
          <p className="mt-0.5 text-caption text-muted-soft">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

type ActionSheetSettingsGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export function ActionSheetSettingsGroup({
  children,
  className,
}: ActionSheetSettingsGroupProps) {
  return (
    <div
      className={cn(
        "divide-y divide-hairline rounded-md border border-hairline bg-surface-card px-3 py-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ActionSheetEnableRowProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function ActionSheetEnableRow({
  label,
  description,
  children,
  className,
}: ActionSheetEnableRowProps) {
  return (
    <ActionSheetToggleRow label={label} description={description} className={className}>
      {children}
    </ActionSheetToggleRow>
  );
}

type ActionSheetListProps = {
  children: React.ReactNode;
  className?: string;
};

export function ActionSheetList({ children, className }: ActionSheetListProps) {
  return (
    <ul
      className={cn(
        "divide-y divide-hairline overflow-hidden rounded-md border border-hairline bg-surface-card",
        className,
      )}
    >
      {children}
    </ul>
  );
}

export function ActionSheetListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <li className={cn("px-3 py-2.5", className)}>{children}</li>;
}

export function ActionSheetEmpty({ children }: { children: React.ReactNode }) {
  return <p className="text-body-sm text-muted-soft">{children}</p>;
}
