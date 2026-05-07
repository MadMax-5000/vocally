"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createAIAgent, type CreateAgentInput } from "@/lib/actions/agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function NewAgentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const input: CreateAgentInput = {
      name: formData.get("name") as string,
      title: formData.get("title") as string,
      field: formData.get("field") as string,
      instructions: formData.get("instructions") as string,
    };

    const result = await createAIAgent(input);

    if (!result.success) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Agent created successfully");
    router.push("/dashboard/agents");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8 py-2">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="icon-sm" className="text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-display-sm font-display font-bold tracking-tight text-ink">
          Create AI Agent
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-8">
        <div className="space-y-2">
          <Label htmlFor="name">Agent Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Support Assistant"
            required
            maxLength={100}
            disabled={isSubmitting}
          />
          <p className="text-caption text-muted-soft">
            A recognizable name for your AI agent.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Role</Label>
          <Input
            id="title"
            name="title"
            placeholder="Customer Support AI"
            required
            maxLength={100}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field">Field / Industry</Label>
          <Input
            id="field"
            name="field"
            placeholder="E-commerce"
            required
            maxLength={100}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Custom Instructions</Label>
          <Textarea
            id="instructions"
            name="instructions"
            placeholder="You are a helpful AI support assistant for our company. Be concise, professional, and friendly."
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            disabled={isSubmitting}
          />
          <p className="text-caption text-muted-soft">
            Define how your agent should behave and respond. Minimum 10 characters.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard/agents">
            <Button variant="outline" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Agent"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
