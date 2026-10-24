import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { AnselioLogo } from "@/components/brand/AnselioLogo";
import { FrostedPanel } from "@/components/marketing/FrostedPanel";
import { StaggerGrid } from "@/components/marketing/ScrollReveal";
import { AppIcon } from "@/components/ui/app-icon";
import { ArrowUpRightIcon, CheckIcon, LoaderIcon } from "@/lib/icons/app-icons";
import { cn } from "@/lib/utils";

const container = "mx-auto w-full max-w-[1476px] px-6";

/* ─── Small display helpers ─── */

function InitialAvatar({ initial, className }: { initial: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none",
        className,
      )}
    >
      {initial}
    </span>
  );
}

function AnselioAvatar() {
  return (
    <span aria-hidden className="flex size-6 shrink-0 items-center justify-center">
      <AnselioLogo variant="black" size="sm" />
    </span>
  );
}

function MessageMeta({
  avatar,
  name,
  time,
}: {
  avatar: React.ReactNode;
  name: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {avatar}
      <span className="text-[11px] font-medium leading-none text-warm-ink">{name}</span>
      <span className="tabular text-[10px] leading-none text-warm-body/75">{time}</span>
    </div>
  );
}

function Bubble({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "customer" | "agent";
}) {
  return (
    <p
      className={cn(
        "mt-1.5 rounded-lg px-2.5 py-2 text-[11.5px] leading-[1.45] text-warm-ink",
        tone === "customer"
          ? "border border-[#EFEAE2] bg-white"
          : "bg-[#F3F0EA]",
      )}
    >
      {children}
    </p>
  );
}

/* ─── Card 1 — resolve in seconds ─── */

function ResolvePanel({
  customerName,
  customerTime,
  customerMessage,
  agentName,
  agentTime,
  agentMessage,
  status,
}: {
  customerName: string;
  customerTime: string;
  customerMessage: string;
  agentName: string;
  agentTime: string;
  agentMessage: string;
  status: string;
}) {
  return (
    <FrostedPanel className="w-full max-w-[88%]">
      <MessageMeta
        avatar={<InitialAvatar initial={customerName.slice(0, 1)} className="bg-[#EDE7DD] text-[#8C8377]" />}
        name={customerName}
        time={customerTime}
      />
      <Bubble tone="customer">{customerMessage}</Bubble>

      <div className="mt-2.5">
        <MessageMeta avatar={<AnselioAvatar />} name={agentName} time={agentTime} />
        <Bubble tone="agent">{agentMessage}</Bubble>
      </div>

      <p className="mt-2.5 flex items-center justify-center gap-1 border-t border-[#EAE5DC] pt-2 text-[10.5px] font-medium text-warm-body">
        <span aria-hidden>✦</span>
        {status}
        <AppIcon icon={CheckIcon} size={10} strokeWidth={2.4} />
      </p>
    </FrostedPanel>
  );
}

/* ─── Card 2 — learn from your docs ─── */

type LearnRow = {
  title: string;
  source: string;
  status: "learned" | "syncing";
};

function LearnPanel({
  rows,
  learnedLabel,
  syncingLabel,
}: {
  rows: LearnRow[];
  learnedLabel: string;
  syncingLabel: string;
}) {
  return (
    <FrostedPanel className="w-full max-w-[92%]">
      <ul className="divide-y divide-[#E9E4DB]">
        {rows.map((row) => {
          const syncing = row.status === "syncing";
          return (
            <li
              key={row.title}
              className="flex items-center justify-between gap-2.5 py-2 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[11.5px] font-medium leading-tight text-warm-ink">
                  {row.title}
                </p>
                <p className="mt-0.5 truncate text-[10px] leading-tight text-warm-body/80">
                  {row.source}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] font-medium leading-none",
                  syncing
                    ? "border-[#EBD9BC] bg-[#FBF2E3] text-[#A8762F]"
                    : "border-[#CFE8D8] bg-[#EEF7F1] text-[#3F8A5B]",
                )}
              >
                <AppIcon
                  icon={syncing ? LoaderIcon : CheckIcon}
                  size={9}
                  strokeWidth={2.4}
                  className={
                    syncing ? "animate-spin [animation-duration:2.5s] motion-reduce:animate-none" : undefined
                  }
                />
                {syncing ? syncingLabel : learnedLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </FrostedPanel>
  );
}

/* ─── Card 3 — know when to escalate ─── */

function EscalatePanel({
  agentName,
  agentTime,
  agentMessage,
  handoff,
  humanName,
  humanTime,
  humanMessage,
}: {
  agentName: string;
  agentTime: string;
  agentMessage: string;
  handoff: string;
  humanName: string;
  humanTime: string;
  humanMessage: string;
}) {
  return (
    <FrostedPanel className="w-full max-w-[88%]">
      <MessageMeta avatar={<AnselioAvatar />} name={agentName} time={agentTime} />
      <Bubble tone="agent">{agentMessage}</Bubble>

      <p className="my-2.5 flex items-center justify-center gap-1 border-t border-[#EAE5DC] pt-2 text-[9.5px] font-medium text-warm-body">
        <AppIcon icon={ArrowUpRightIcon} size={9} strokeWidth={2.2} />
        <span className="text-center">{handoff}</span>
        <AppIcon icon={CheckIcon} size={9} strokeWidth={2.4} />
      </p>

      <MessageMeta
        avatar={<InitialAvatar initial={humanName.slice(0, 1)} className="bg-[#E7E1D7] text-[#7F776C]" />}
        name={humanName}
        time={humanTime}
      />
      <Bubble tone="customer">{humanMessage}</Bubble>
    </FrostedPanel>
  );
}

/* ─── Card shell ─── */

function WaysCard({
  image,
  panel,
  title,
  body,
  imagePosition,
}: {
  image: string;
  panel: React.ReactNode;
  title: string;
  body: string;
  imagePosition: string;
}) {
  return (
    <figure className="flex flex-col">
      <div className="relative aspect-[9/8] overflow-hidden rounded-xxl">
        <Image
          src={image}
          alt=""
          aria-hidden
          fill
          unoptimized
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={cn("object-cover", imagePosition)}
        />
        <div aria-hidden className="absolute inset-0 bg-white/10" />
        <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-6">{panel}</div>
      </div>

      <figcaption className="mt-5">
        <h3 className="font-display text-[17px] leading-[1.25] text-black">{title}</h3>
        <p className="mt-1.5 max-w-[300px] text-[14px] leading-[1.5] text-warm-body">{body}</p>
      </figcaption>
    </figure>
  );
}

/* ─── Section ─── */

export async function ThreeWaysSection() {
  const t = await getTranslations("landing.threeWays");

  const learnRows: LearnRow[] = [
    {
      title: t("cards.learn.sources.prices.title"),
      source: t("cards.learn.sources.prices.source"),
      status: "learned",
    },
    {
      title: t("cards.learn.sources.faq.title"),
      source: t("cards.learn.sources.faq.source"),
      status: "learned",
    },
    {
      title: t("cards.learn.sources.availability.title"),
      source: t("cards.learn.sources.availability.source"),
      status: "learned",
    },
    {
      title: t("cards.learn.sources.past.title"),
      source: t("cards.learn.sources.past.source"),
      status: "syncing",
    },
  ];

  return (
    <section className="bg-canvas-warm py-section">
      <div className={container}>
        <div className="max-w-[760px]">
          <p className="flex items-center gap-2 text-[13px] font-medium leading-none text-warm-body">
            <span aria-hidden className="size-1 rounded-full bg-warm-body" />
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-display text-[38px] leading-[1.06] tracking-[-2.4px] text-black sm:text-[52px]">
            <span className="block">{t("title")}</span>
            <span className="block text-warm-body">{t("titleMuted")}</span>
          </h2>
        </div>
      </div>

      <div className={container}>
        <StaggerGrid className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <WaysCard
            image="/images/cards-background.webp"
            imagePosition="object-center"
            title={t("cards.resolve.title")}
            body={t("cards.resolve.body")}
            panel={
              <ResolvePanel
                customerName={t("cards.resolve.customerName")}
                customerTime={t("cards.resolve.customerTime")}
                customerMessage={t("cards.resolve.customerMessage")}
                agentName={t("cards.resolve.agentName")}
                agentTime={t("cards.resolve.agentTime")}
                agentMessage={t("cards.resolve.agentMessage")}
                status={t("cards.resolve.status")}
              />
            }
          />

          <WaysCard
            image="/images/cards-background2.webp"
            imagePosition="object-center"
            title={t("cards.learn.title")}
            body={t("cards.learn.body")}
            panel={
              <LearnPanel
                rows={learnRows}
                learnedLabel={t("cards.learn.statuses.learned")}
                syncingLabel={t("cards.learn.statuses.syncing")}
              />
            }
          />

          <WaysCard
            image="/images/cards-background3.webp"
            imagePosition="object-center"
            title={t("cards.escalate.title")}
            body={t("cards.escalate.body")}
            panel={
              <EscalatePanel
                agentName={t("cards.escalate.agentName")}
                agentTime={t("cards.escalate.agentTime")}
                agentMessage={t("cards.escalate.agentMessage")}
                handoff={t("cards.escalate.handoff")}
                humanName={t("cards.escalate.humanName")}
                humanTime={t("cards.escalate.humanTime")}
                humanMessage={t("cards.escalate.humanMessage")}
              />
            }
          />
        </StaggerGrid>
      </div>
    </section>
  );
}
