"use client";

import { useEffect, useState } from "react";

type ContactStatus = "sent" | "error";

type ContactToastProps = {
  status: ContactStatus | null;
  firstName?: string;
};

function ToastIcon({ status }: { status: ContactStatus }) {
  if (status === "sent") {
    return (
      <svg
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="size-4 shrink-0 text-success"
        fill="none"
      >
        <path
          d="M4.5 10.5 8.25 14 15.5 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="size-4 shrink-0 text-destructive"
      fill="none"
    >
      <path
        d="m6 6 8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getMessage(status: ContactStatus, firstName?: string) {
  if (status === "sent") {
    return firstName
      ? `Thanks for your message, ${firstName}. We'll get back to you soon.`
      : "Thanks for your message. We'll get back to you soon.";
  }

  return "Message could not be sent.";
}

export function ContactToast({
  status: initialStatus,
  firstName,
}: ContactToastProps) {
  const [status, setStatus] = useState<ContactStatus | null>(initialStatus);

  useEffect(() => {
    if (!status) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });

    const url = new URL(window.location.href);
    url.searchParams.delete("contact");
    url.searchParams.delete("firstName");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);

    const timeout = window.setTimeout(() => {
      setStatus(null);
    }, 4200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [status]);

  if (!status) {
    return null;
  }

  return (
    <div
      className="fixed left-1/2 top-[calc(var(--header-height)+1rem)] z-[60] flex w-fit max-w-[calc(100vw-2rem)] -translate-x-1/2 items-start gap-3 border-2 border-foreground bg-[var(--toast-background)] px-5 py-3 text-sm font-medium leading-snug text-foreground shadow-[0_8px_0_rgb(0_0_0/0.12)] md:top-[calc(var(--header-height)+1.5rem)]"
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
    >
      <ToastIcon status={status} />
      <span>{getMessage(status, firstName)}</span>
      <button
        type="button"
        aria-label="Dismiss message"
        className="-mr-2 -mt-2 ml-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center text-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={(event) => {
          event.stopPropagation();
          setStatus(null);
        }}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none">
          <path
            d="m6 6 8 8M14 6l-8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
