"use client";
import { AppIcon } from "@/components/ui/app-icon"
import { LoaderIcon } from "@/lib/icons/app-icons"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CompleteStepProps = {
  name: string;
  website: string;
  description: string;
  handoffEnabled: boolean;
  onChangeName: (value: string) => void;
  onChangeWebsite: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangeHandoff: (value: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
};

export function CompleteStep({
  name,
  website,
  description,
  handoffEnabled,
  onChangeName,
  onChangeWebsite,
  onChangeDescription,
  onChangeHandoff,
  onSubmit,
  isSubmitting,
  errorMessage,
}: CompleteStepProps) {
  const nameLen = name.length;

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <h1 className="text-display-sm font-display tracking-tight text-ink text-balance">
          Complete your agent
        </h1>
        <p className="max-w-xl text-body-sm leading-relaxed text-muted">
          Name your agent, describe its goal, and optionally add your website.
        </p>
      </header>

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="agent-name">Agent name *</Label>
            <span className="text-caption text-muted-soft">
              {nameLen}/50
            </span>
          </div>
          <Input
            id="agent-name"
            value={name}
            onChange={(e) => onChangeName(e.target.value.slice(0, 50))}
            placeholder="Enter agent name..."
            maxLength={50}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-website">Website (optional)</Label>
          <Input
            id="agent-website"
            type="url"
            value={website}
            onChange={(e) => onChangeWebsite(e.target.value)}
            placeholder="https://example.com"
            disabled={isSubmitting}
          />
          <p className="text-caption leading-relaxed text-muted">
            We&apos;ll only access publicly available information from your website to personalize
            your agent.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agent-goal">Main goal *</Label>
          <Textarea
            id="agent-goal"
            value={description}
            onChange={(e) => onChangeDescription(e.target.value.slice(0, 500))}
            placeholder="Describe what you want your agent to accomplish..."
            rows={5}
            maxLength={500}
            required
            minLength={1}
            disabled={isSubmitting}
          />
          <p className="text-caption text-muted-soft">{description.length}/500</p>
        </div>

        <div className="space-y-2">
          <span className="text-title-sm font-medium text-ink">Human handoff</span>
          <p className="text-body-sm text-body">
            Allow customers to reach a live agent when they ask for a human.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={handoffEnabled ? "primary" : "outline"}
              size="sm"
              onClick={() => onChangeHandoff(true)}
              disabled={isSubmitting}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={!handoffEnabled ? "primary" : "outline"}
              size="sm"
              onClick={() => onChangeHandoff(false)}
              disabled={isSubmitting}
            >
              No
            </Button>
          </div>
        </div>

        {errorMessage ? (
          <p className="text-caption text-semantic-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <AppIcon icon={LoaderIcon} className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create agent"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
