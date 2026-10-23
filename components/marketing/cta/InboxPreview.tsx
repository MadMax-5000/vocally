import { cn } from "@/lib/utils";

const navigation = [
  { label: "Inbox", active: true },
  { label: "Tickets" },
  { label: "Automations" },
  { label: "Knowledge base" },
  { label: "Analytics" },
  { label: "Integrations" },
];

const conversations = [
  { initials: "EJ", name: "Emily Jones", time: "7m", preview: "Still can't log in after the reset.", active: false },
  { initials: "AL", name: "Anna Lubin", time: "8m", preview: "My headphones stopped charging.", active: true },
  { initials: "SJ", name: "Sarah Johnson", time: "9m", preview: "Can I change the shipping address?", active: false },
  { initials: "MB", name: "Michael Brown", time: "10m", preview: "I'd like to exchange the charger.", active: false },
  { initials: "DW", name: "David Wilson", time: "12m", preview: "The discount code isn't applying.", active: false },
];

/** Compact inbox mock used as the product visual in the closing CTA. */
export function InboxPreview() {
  return (
    <div className="flex h-full w-full overflow-hidden rounded-[12px] bg-white text-[10px] shadow-[0_28px_60px_-28px_rgba(12,10,9,0.4)] ring-1 ring-black/[0.06]">
      <div className="hidden w-[96px] shrink-0 flex-col border-e border-hairline/60 bg-[#FCFBF7] px-2.5 py-3 sm:flex">
        <div className="flex items-center gap-1.5 px-1">
          <span className="flex size-[16px] items-center justify-center rounded-[5px] bg-ink text-[8px] font-semibold leading-none text-white">
            A
          </span>
          <span className="font-display text-[11px] leading-none text-ink">Anselio</span>
        </div>

        <div className="mt-4 space-y-[2px]">
          {navigation.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-1.5 rounded-[5px] px-1.5 py-[5px] text-[8.5px] leading-none",
                item.active ? "bg-primary/10 text-ink" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "size-[4px] shrink-0 rounded-full",
                  item.active ? "bg-primary" : "bg-muted/35",
                )}
              />
              {item.label}
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-1.5 rounded-[6px] border border-hairline/60 px-1.5 py-1.5">
          <span className="flex size-[16px] items-center justify-center rounded-full bg-[#EDE8DD] text-[7px] font-medium text-ink">
            SL
          </span>
          <span className="text-[7.5px] leading-[1.3] text-muted">
            Sofia L.
            <br />
            Admin
          </span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col border-e border-hairline/60 sm:w-[45%] sm:flex-none">
        <div className="flex items-center justify-between px-2.5 pb-1.5 pt-2.5">
          <span className="text-[9px] font-medium text-ink">Inbox</span>
          <span className="rounded-full bg-[#F2F0E9] px-1.5 py-[2px] text-[7.5px] leading-none text-muted">
            24
          </span>
        </div>

        <div className="mx-2.5 mb-1.5 flex items-center gap-1 rounded-[5px] bg-[#F6F4EF] px-1.5 py-[5px] text-[8px] text-muted">
          <svg
            viewBox="0 0 12 12"
            className="size-[9px] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden
          >
            <circle cx="5.2" cy="5.2" r="3.4" />
            <path d="m8 8 2.4 2.4" strokeLinecap="round" />
          </svg>
          Search conversations
        </div>

        <div className="flex-1 overflow-hidden">
          {conversations.map((row) => (
            <div
              key={row.name}
              className={cn(
                "border-b border-hairline/40 px-2.5 py-[6px]",
                row.active && "bg-[#FAF8F2]",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#EDE8DD] text-[6.5px] font-medium text-ink">
                  {row.initials}
                </span>
                <span className="truncate text-[8.5px] font-medium text-ink">{row.name}</span>
                <span className="ms-auto shrink-0 text-[7px] text-muted">{row.time}</span>
              </div>
              <p className="mt-[2px] truncate ps-[22px] text-[7.5px] leading-none text-muted">
                {row.preview}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 flex-col sm:flex">
        <div className="flex items-start justify-between gap-2 border-b border-hairline/60 px-2.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-medium leading-tight text-ink">Anna Lubin</p>
            <p className="mt-[1px] truncate text-[7px] leading-tight text-muted">
              Ticket #2847 · Email
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-[2px] text-[6.5px] font-medium leading-none text-primary">
            AI
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-hidden px-2.5 py-2.5">
          <p className="ms-auto max-w-[88%] rounded-[7px] rounded-ee-[2px] bg-[#F2F0E9] px-2 py-[6px] text-[7.5px] leading-[1.45] text-ink">
            Hi — my headphones only hold a charge for an hour. Can I get a replacement?
          </p>

          <div className="flex items-start gap-1.5">
            <span className="flex size-[14px] shrink-0 items-center justify-center rounded-full bg-ink text-[6px] font-semibold leading-none text-white">
              A
            </span>
            <p className="max-w-[90%] rounded-[7px] rounded-es-[2px] bg-[#FFF1EB] px-2 py-[6px] text-[7.5px] leading-[1.45] text-ink">
              Sorry about that, Anna. Your order is covered by our 1-year warranty — a new pair ships
              today.
            </p>
          </div>

          <p className="ms-auto max-w-[82%] rounded-[7px] rounded-ee-[2px] bg-[#F2F0E9] px-2 py-[6px] text-[7.5px] leading-[1.45] text-ink">
            That was fast. Thank you!
          </p>
        </div>

        <div className="m-2 mt-0 flex items-center justify-between rounded-[6px] border border-hairline px-2 py-[7px] text-[7.5px] text-muted">
          <span>Type your reply…</span>
          <svg
            viewBox="0 0 12 12"
            className="size-[9px] text-ink"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden
          >
            <path d="M2 6h8M6.8 2.8 10 6l-3.2 3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
