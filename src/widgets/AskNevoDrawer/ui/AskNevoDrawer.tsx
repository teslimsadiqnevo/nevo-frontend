"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NevoLogo } from "@/shared/ui";

const SUGGESTIONS = [
  "Explain this differently",
  "I don't understand",
  "Give me an example",
];

type AskNevoMessage = {
  role: "user" | "nevo";
  content: string;
};

type AskNevoDrawerProps = {
  open: boolean;
  onClose: () => void;
  context?: string | null;
  page?: string | null;
  lessonId?: string | null;
  leftInset?: number;
};

export function AskNevoDrawer({
  open,
  onClose,
  context,
  page,
  lessonId,
  leftInset = 0,
}: AskNevoDrawerProps) {
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<AskNevoMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setValue("");
      setMessages([]);
      setError(null);
      setIsSending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, error, isSending]);

  const hasInput = value.trim().length > 0;
  const showEmptyPrompt = messages.length === 0 && !hasInput && !error;
  const submitLabel = useMemo(() => {
    if (isSending) return "Sending...";
    return "Ask anything...";
  }, [isSending]);

  if (!open) return null;

  const handleSend = async () => {
    const message = value.trim();
    if (!message || isSending) return;

    setError(null);
    setIsSending(true);
    setValue("");
    setMessages((current) => [...current, { role: "user", content: message }]);

    try {
      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          ...(lessonId ? { lesson_id: lessonId } : {}),
          ...(context ? { context } : {}),
          ...(page ? { page } : {}),
          ...(messages.length > 0 ? { history: messages } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail =
          typeof data?.detail === "string"
            ? data.detail
            : "Ask Nevo could not respond right now.";
        throw new Error(detail);
      }

      const responseText =
        typeof data?.response === "string" && data.response.trim().length > 0
          ? data.response.trim()
          : "Nevo did not return a response.";

      setMessages((current) => [
        ...current,
        { role: "nevo", content: responseText },
      ]);
    } catch (sendError: any) {
      setError(sendError?.message || "Ask Nevo could not respond right now.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/35 animate-fade-in"
        onClick={onClose}
        aria-hidden
        style={{ left: leftInset }}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="absolute bottom-0 rounded-t-[20px] animate-slide-up shadow-[0_-12px_32px_rgba(0,0,0,0.18)]"
        style={{ left: leftInset, width: "1071px" }}
      >
        <div className="flex w-[1071px] h-[800px] bg-[#FAF9F6] relative">
          {/* Sidebar */}
          <aside className="w-[220px] min-w-[220px] h-full bg-[#3B3F6E] flex flex-col px-4 pt-6 pb-6">
            <div className="w-[172px] h-8 relative mb-6">
              <NevoLogo className="h-6 w-auto" width={80} height={24} />
            </div>

            <nav className="flex flex-col gap-1">
              <div className="h-12 flex items-center px-5 gap-3 bg-[#4A5080] rounded-[8px] relative">
                <div className="absolute left-0 top-0 w-[3px] h-12 bg-[#F7F1E6]" />
                <div className="w-5 h-5 bg-transparent border border-[#F7F1E6] rounded" />
                <span className="text-[14px] font-medium text-[#F7F1E6]">
                  Lessons
                </span>
              </div>

              <div className="h-12 flex items-center px-5 gap-3 text-[#F7F1E6] opacity-60">
                <div className="w-5 h-5 bg-transparent border border-[#F7F1E6] rounded opacity-50" />
                <span className="text-[14px] font-medium">Downloads</span>
              </div>

              <div className="h-12 flex items-center px-5 gap-3 text-[#F7F1E6] opacity-60">
                <div className="w-5 h-5 bg-transparent border border-[#F7F1E6] rounded opacity-50" />
                <span className="text-[14px] font-medium">Progress</span>
              </div>

              <div className="h-12 flex items-center px-5 gap-3 text-[#F7F1E6] opacity-60 mt-4">
                <div className="w-5 h-5 bg-[#F7F1E6] rounded-full" />
                <span className="text-[14px] font-medium">Profile</span>
              </div>
            </nav>

            <div className="mt-auto px-2">
              <button className="w-[188px] h-11 flex items-center justify-center gap-2 bg-[#4A5080] border border-[rgba(247,241,230,0.3)] rounded-full text-[#F7F1E6] font-semibold">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="opacity-90"
                >
                  <path
                    d="M8 2L8 10"
                    stroke="#F7F1E6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Ask Nevo</span>
              </button>
            </div>
          </aside>

          {/* Main chat area */}
          <section className="flex-1 relative w-[804px] bg-[#F7F1E6]">
            <div className="absolute left-0 top-0 w-[804px] h-[844px] bg-[#F7F1E6] rounded-t-[20px]" />

            <div className="flex flex-col px-8 pt-6 pb-6 h-full">
              <div className="w-full h-14 bg-[rgba(154,156,203,0.1)] rounded-t-[12px] flex items-center px-4 gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9A9CCB]" />
                {context ? (
                  <span className="text-[13px] leading-5 text-[#3B3F6E]">{`You're on: ${context}`}</span>
                ) : (
                  <span className="text-[13px] leading-5 text-[#3B3F6E]">
                    You're on: Lesson
                  </span>
                )}
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto mt-4">
                {showEmptyPrompt ? (
                  <div className="h-full flex flex-col items-center justify-center gap-6">
                    <p className="text-[15px] leading-[22px] text-graphite/55 text-center">
                      What can I help you with?
                    </p>
                    <div className="flex flex-wrap justify-start gap-2 max-w-[600px]">
                      {SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setValue(suggestion);
                            setError(null);
                          }}
                          className="flex items-center px-3 h-8 rounded-full bg-lavender-15 text-indigo text-[13px] leading-5 cursor-pointer border-none"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto flex w-full max-w-[740px] flex-col gap-4">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[12px] px-4 py-3 text-[14px] leading-6 ${message.role === "user" ? "bg-[#3B3F6E] text-[#F7F1E6]" : "bg-white border border-[#E0D9CE] text-graphite"}`}
                        >
                          {message.content}
                        </div>
                      </div>
                    ))}

                    {isSending ? (
                      <div className="flex justify-start">
                        <div className="rounded-[12px] border border-[#E0D9CE] bg-white px-4 py-3 text-[14px] leading-6 text-graphite/55">
                          Nevo is thinking...
                        </div>
                      </div>
                    ) : null}

                    {error ? (
                      <div className="rounded-[12px] border border-[#E8A84A] bg-[#FFF7EC] px-4 py-3 text-[13px] leading-5 text-[#8C5C17]">
                        {error}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="w-full h-20 mt-4 bg-[#F7F1E6] border-t border-[#E0D9CE] flex items-center px-4">
                <div className="flex-1 h-11 bg-[#F7F1E6] border border-[#E0D9CE] rounded-[20px] flex items-center px-[17px]">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={submitLabel}
                    className="w-full bg-transparent border-none outline-none text-[15px] leading-[22px] text-graphite placeholder:text-graphite/35"
                  />
                </div>
                <button
                  type="button"
                  disabled={!hasInput || isSending}
                  onClick={() => void handleSend()}
                  className="flex justify-center items-center w-10 h-10 rounded-full bg-[#3B3F6E] ml-3"
                  style={{ opacity: !hasInput || isSending ? 0.4 : 1 }}
                  aria-label="Send"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M3.91 10H10M16.09 10L3.91 4.09L6.5 10L3.91 15.91L16.09 10Z"
                      stroke="#F7F1E6"
                      strokeWidth="1.875"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
