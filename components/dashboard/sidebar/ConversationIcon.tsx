import { cn } from "@/lib/utils";

/** Matches `public/svg/conversation.svg` (currentColor strokes). */
export function ConversationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0", className)}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M17.9167 10C17.9167 5.83334 14.838 3.33334 10 3.33334C5.16208 3.33334 2.08337 5.83334 2.08337 10C2.08337 11.0786 2.82855 12.908 2.94717 13.1924C2.95802 13.2184 2.96875 13.2421 2.97845 13.2685C3.05967 13.49 3.38597 14.6519 2.08337 16.3699C3.84263 17.2033 5.71096 15.8333 5.71096 15.8333C7.00358 16.5129 8.54162 16.6667 10 16.6667C14.838 16.6667 17.9167 14.1667 17.9167 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="round"
      />
      <path
        d="M10.0331 8V12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 9V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.0331 9V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
