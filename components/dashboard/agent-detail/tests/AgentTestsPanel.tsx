"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderIcon, PlusIcon, XIcon } from "@/lib/icons/app-icons";
import {
  addAgentTestQuestion,
  deleteAgentTestQuestion,
  listAgentTestQuestions,
  runAgentTestQuestionAction,
  type AgentTestQuestionRow,
} from "@/lib/actions/agent-tests";
import { MAX_AGENT_TEST_QUESTIONS } from "@/lib/agent-tests/constants";

type RowStatus = "idle" | "in_progress" | "passed" | "failed" | "error";

type PanelRow = {
  id: string;
  prompt: string;
  status: RowStatus;
  response: string | null;
  judgeReason: string | null;
};

type Props = {
  agentId: string;
  testingAs: string;
};

function statusFromRun(
  run: AgentTestQuestionRow["latestRun"],
): RowStatus {
  if (!run) return "idle";
  switch (run.status) {
    case "PASSED":
      return "passed";
    case "FAILED":
      return "failed";
    case "ERROR":
      return "error";
    case "RUNNING":
      return "in_progress";
    default:
      return "idle";
  }
}

function rowFromPersisted(row: AgentTestQuestionRow): PanelRow {
  return {
    id: row.id,
    prompt: row.prompt,
    status: statusFromRun(row.latestRun),
    response: row.latestRun?.response ?? null,
    judgeReason: row.latestRun?.judgeReason ?? null,
  };
}

function PassedMark({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#16a34a]">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22c55e]">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
          <path
            d="M3 6.2 5.1 8.3 9 4"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label}
    </span>
  );
}

function InProgressMark({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#f97316]">
      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />
        <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  );
}

function FailedMark({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-semantic-error">
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-semantic-error">
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden>
          <path d="M3.5 3.5 8.5 8.5M8.5 3.5 3.5 8.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      {label}
    </span>
  );
}

function StatusCell({ status, t }: { status: RowStatus; t: (key: string) => string }) {
  if (status === "passed") return <PassedMark label={t("passed")} />;
  if (status === "in_progress") return <InProgressMark label={t("inProgress")} />;
  if (status === "failed") return <FailedMark label={t("failed")} />;
  if (status === "error") return <FailedMark label={t("error")} />;
  return <span className="text-[12px] font-medium text-muted">{t("idle")}</span>;
}

export function AgentTestsPanel({ agentId, testingAs }: Props) {
  const t = useTranslations("dashboard.agentDetail.tests");
  const addInputId = useId();

  const [rows, setRows] = useState<PanelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const runningIds = useRef(new Set<string>());

  const anyRunning = rows.some((row) => row.status === "in_progress") || runningAll;
  const canAdd = rows.length < MAX_AGENT_TEST_QUESTIONS && !anyRunning;

  const applyResult = useCallback((id: string, result: {
    status: RowStatus;
    response: string | null;
    judgeReason: string | null;
  }) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...result } : row)),
    );
  }, []);

  const runQuestion = useCallback(async (row: PanelRow) => {
    if (runningIds.current.has(row.id)) return;
    runningIds.current.add(row.id);
    applyResult(row.id, { status: "in_progress", response: row.response, judgeReason: row.judgeReason });
    try {
      const result = await runAgentTestQuestionAction(row.id);
      if (!result.success) {
        toast.error(result.error);
        applyResult(row.id, { status: "error", response: null, judgeReason: result.error });
        return;
      }
      applyResult(row.id, {
        status: statusFromRun(result.data),
        response: result.data.response,
        judgeReason: result.data.judgeReason,
      });
    } catch {
      toast.error(t("failedRun"));
      applyResult(row.id, { status: "error", response: null, judgeReason: t("failedRun") });
    } finally {
      runningIds.current.delete(row.id);
    }
  }, [applyResult, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await listAgentTestQuestions(agentId);
      if (cancelled) return;
      if (!result.success) {
        toast.error(result.error);
      }
      setRows(result.data.map(rowFromPersisted));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const handleAdd = async () => {
    const prompt = draft.trim();
    if (!prompt || !canAdd) return;

    const result = await addAgentTestQuestion(agentId, prompt);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    const row = rowFromPersisted(result.data);
    setRows((prev) => [...prev, row]);
    setDraft("");
    setAdding(false);
    await runQuestion(row);
  };

  const handleDelete = async (id: string) => {
    if (anyRunning) return;
    const result = await deleteAgentTestQuestion(id);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== id));
    setExpandedId((current) => (current === id ? null : current));
  };

  const handleRunAll = async () => {
    if (anyRunning) return;
    const unanswered = rows.filter(
      (row) => row.status === "idle" || row.status === "error",
    );
    const targets =
      unanswered.length > 0
        ? unanswered
        : rows.filter((row) => row.status !== "in_progress");
    if (targets.length === 0) return;
    setRunningAll(true);
    try {
      for (const row of targets) {
        await runQuestion(row);
      }
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="rounded-xl border border-hairline bg-surface-card">
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div>
          <p className="text-[14px] font-semibold leading-none text-ink">
            {t("questionCount", { count: rows.length })}
          </p>
          <p className="mt-1.5 text-[12px] text-muted">{t("testingAs", { name: testingAs })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => void handleRunAll()}
            disabled={rows.length === 0 || anyRunning}
          >
            {anyRunning ? t("running") : t("run")}
          </Button>
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={!canAdd}
            className="inline-flex h-8 shrink-0 items-center rounded-md border border-hairline bg-surface-card px-2.5 text-[12px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("addQuestion")}
          </button>
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-hairline pb-1.5 text-[11px] font-medium text-muted">
          <span>{t("question")}</span>
          <span className="w-[7.25rem]">{t("status")}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted">
            <AppIcon icon={LoaderIcon} size={16} className="animate-spin" />
          </div>
        ) : rows.length === 0 && !adding ? (
          <p className="py-8 text-center text-[12.5px] text-muted">{t("empty")}</p>
        ) : (
          <ul>
            {rows.map((row) => {
              const open = expandedId === row.id && Boolean(row.response || row.judgeReason);
              return (
                <li key={row.id} className="border-b border-hairline-soft last:border-b-0">
                  <div className="flex items-center gap-2 py-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId((current) => (current === row.id ? null : row.id))
                      }
                      className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-3 text-start"
                    >
                      <span className="truncate text-[12.5px] text-ink">{row.prompt}</span>
                      <span className="w-[7.25rem]">
                        <StatusCell status={row.status} t={t} />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row.id)}
                      disabled={anyRunning}
                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-canvas-soft hover:text-ink disabled:opacity-40"
                      aria-label={t("deleteQuestion")}
                    >
                      <AppIcon icon={XIcon} size={12} />
                    </button>
                  </div>
                  {open ? (
                    <div className="pb-3 pe-8">
                      {row.response ? (
                        <p className="text-[12.5px] leading-relaxed text-body">{row.response}</p>
                      ) : null}
                      {row.judgeReason ? (
                        <p className="mt-1.5 text-[11.5px] text-muted">{row.judgeReason}</p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {adding ? (
          <form
            className="flex items-center gap-2 py-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleAdd();
            }}
          >
            <label htmlFor={addInputId} className="sr-only">
              {t("addPlaceholder")}
            </label>
            <Input
              id={addInputId}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("addPlaceholder")}
              className="h-8 text-[12.5px]"
              autoFocus
              maxLength={500}
            />
            <Button type="submit" size="xs" disabled={!draft.trim()}>
              <AppIcon icon={PlusIcon} size={12} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setAdding(false);
                setDraft("");
              }}
            >
              {t("cancelAdd")}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
