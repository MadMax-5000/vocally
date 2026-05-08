"use client";

import { useCallback, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AgentTone } from "@prisma/client";
import { toast } from "sonner";

import {
  createAIAgentFromOnboarding,
  type CreateAgentFromOnboardingInput,
} from "@/lib/actions/agents";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { useClickSound } from "@/lib/hooks/useClickSound";

import {
  initialWizardState,
  ONBOARDING_STEP_ORDER,
  type OnboardingStep,
  type WizardFormState,
} from "./wizard-types";
import { StartStep } from "./_steps/StartStep";
import { ToneStep } from "./_steps/ToneStep";
import { CreativityStep } from "./_steps/CreativityStep";
import { LanguagesStep } from "./_steps/LanguagesStep";
import { ChannelsStep } from "./_steps/ChannelsStep";
import { KnowledgeStep } from "./_steps/KnowledgeStep";
import { CompleteStep } from "./_steps/CompleteStep";

type WizardAction =
  | { type: "PATCH"; patch: Partial<WizardFormState> }
  | { type: "SET_STEP"; step: OnboardingStep };

function wizardReducer(state: WizardFormState, action: WizardAction): WizardFormState {
  switch (action.type) {
    case "PATCH":
      return { ...state, ...action.patch };
    case "SET_STEP":
      return { ...state, step: action.step };
    default:
      return state;
  }
}

function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEP_ORDER.indexOf(step);
}

function goToStep(step: OnboardingStep): WizardAction {
  return { type: "SET_STEP", step };
}

type KnowledgeDocRow = { id: string; title: string };

export function NewAgentWizard({ knowledgeDocs }: { knowledgeDocs: KnowledgeDocRow[] }) {
  const router = useRouter();
  const play = useClickSound();
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const idx = stepIndex(state.step);
  const total = ONBOARDING_STEP_ORDER.length;

  const advance = useCallback(
    (next: OnboardingStep) => {
      dispatch(goToStep(next));
    },
    []
  );

  const goBack = useCallback(() => {
    play();
    const i = stepIndex(state.step);
    if (i > 0) {
      dispatch(goToStep(ONBOARDING_STEP_ORDER[i - 1]!));
    }
  }, [play, state.step]);

  const patch = useCallback((p: Partial<WizardFormState>) => {
    dispatch({ type: "PATCH", patch: p });
  }, []);

  const buildPayload = useCallback((): CreateAgentFromOnboardingInput | null => {
    if (!state.creativity) return null;
    if (state.languages.length === 0 || state.channels.length === 0) return null;

    let tone: AgentTone;
    let customTone: string | undefined;
    if (state.toneIsCustom) {
      if (!state.customTone.trim()) return null;
      tone = AgentTone.PROFESSIONAL;
      customTone = state.customTone.trim();
    } else {
      if (!state.tone) return null;
      tone = state.tone;
      customTone = state.customTone.trim() || undefined;
    }

    return {
      tone,
      customTone,
      creativity: state.creativity,
      languages: state.languages,
      channels: state.channels,
      knowledgeDocIds:
        state.knowledgeDocIds.length > 0 ? state.knowledgeDocIds : undefined,
      name: state.name.trim(),
      website: state.website.trim() || undefined,
      description: state.description.trim(),
      handoffEnabled: state.handoffEnabled,
    };
  }, [state]);

  const handleSubmit = useCallback(async () => {
    play();
    setSubmitError(null);
    const payload = buildPayload();
    if (!payload) {
      setSubmitError("Please complete all previous steps.");
      return;
    }
    if (!payload.name || !payload.description) {
      setSubmitError("Name and main goal are required.");
      return;
    }

    setIsSubmitting(true);
    const result = await createAIAgentFromOnboarding(payload);
    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error);
      toast.error(result.error);
      return;
    }

    toast.success("Agent created");
    router.push(`/dashboard/agents/${result.data.id}`);
    router.refresh();
  }, [buildPayload, play, router]);

  const showBack = idx > 0;

  return (
    <OnboardingShell
      currentStepIndex={idx}
      totalSteps={total}
      showBack={showBack}
      onBack={goBack}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {state.step === "start" ? (
            <StartStep
              onSound={play}
              onScratch={() => {
                advance("tone");
              }}
            />
          ) : null}

          {state.step === "tone" ? (
            <ToneStep
              tone={state.tone}
              toneIsCustom={state.toneIsCustom}
              customTone={state.customTone}
              onPickPreset={(value) => {
                play();
                patch({
                  tone: value,
                  toneIsCustom: false,
                  customTone: "",
                });
                advance("creativity");
              }}
              onPickCustom={() => {
                play();
                patch({ toneIsCustom: true, tone: AgentTone.PROFESSIONAL, customTone: "" });
              }}
              onCustomToneChange={(customTone) => patch({ customTone })}
              onContinueCustom={() => {
                if (!state.customTone.trim()) return;
                play();
                advance("creativity");
              }}
            />
          ) : null}

          {state.step === "creativity" ? (
            <CreativityStep
              creativity={state.creativity}
              onPick={(value) => {
                play();
                patch({ creativity: value });
                advance("languages");
              }}
            />
          ) : null}

          {state.step === "languages" ? (
            <LanguagesStep
              languages={state.languages}
              onToggle={(value) => {
                play();
                const has = state.languages.includes(value);
                patch({
                  languages: has
                    ? state.languages.filter((l) => l !== value)
                    : [...state.languages, value],
                });
              }}
              onContinue={() => {
                if (state.languages.length === 0) return;
                play();
                advance("channels");
              }}
            />
          ) : null}

          {state.step === "channels" ? (
            <ChannelsStep
              channels={state.channels}
              onToggle={(value) => {
                play();
                const has = state.channels.includes(value);
                patch({
                  channels: has
                    ? state.channels.filter((c) => c !== value)
                    : [...state.channels, value],
                });
              }}
              onContinue={() => {
                if (state.channels.length === 0) return;
                play();
                advance("knowledge");
              }}
            />
          ) : null}

          {state.step === "knowledge" ? (
            <KnowledgeStep
              docs={knowledgeDocs}
              selectedIds={state.knowledgeDocIds}
              onToggle={(id) => {
                play();
                const has = state.knowledgeDocIds.includes(id);
                patch({
                  knowledgeDocIds: has
                    ? state.knowledgeDocIds.filter((x) => x !== id)
                    : [...state.knowledgeDocIds, id],
                });
              }}
              onSkip={() => {
                play();
                advance("complete");
              }}
              onContinue={() => {
                play();
                advance("complete");
              }}
            />
          ) : null}

          {state.step === "complete" ? (
            <CompleteStep
              name={state.name}
              website={state.website}
              description={state.description}
              handoffEnabled={state.handoffEnabled}
              onChangeName={(name) => patch({ name })}
              onChangeWebsite={(website) => patch({ website })}
              onChangeDescription={(description) => patch({ description })}
              onChangeHandoff={(handoffEnabled) => patch({ handoffEnabled })}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              errorMessage={submitError}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </OnboardingShell>
  );
}
