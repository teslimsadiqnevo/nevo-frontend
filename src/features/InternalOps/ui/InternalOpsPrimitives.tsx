"use client";

import type { ReactNode } from "react";
import { internalTheme } from "./internalOpsTheme";

export function InternalPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[18px] font-bold leading-6 text-[#3b3f6e] md:text-[22px]">
          {title}
        </h2>
        {description ? (
          <p className={`mt-1 text-[13px] leading-5 ${internalTheme.muted}`}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function InternalStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <article className={internalTheme.card}>
      <p className="text-[28px] font-bold leading-none text-[#3b3f6e]">
        {value}
      </p>
      <p className={`mt-2 ${internalTheme.label}`}>{label}</p>
      {helper ? (
        <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>{helper}</p>
      ) : null}
    </article>
  );
}

export function InternalListCard({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children?: ReactNode;
}) {
  return (
    <article className={internalTheme.card}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold text-[#3b3f6e]">
            {title}
          </h3>
          {meta ? (
            <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>{meta}</p>
          ) : null}
        </div>
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#e8a84a]" />
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
    </article>
  );
}

export function InternalSearchInput({
  onChange,
  placeholder,
  value,
}: {
  onChange?: (value: string) => void;
  placeholder: string;
  value?: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{placeholder}</span>
      <input
        className="h-11 w-full rounded-[12px] border border-[#e0d9ce] bg-white px-4 text-[14px] text-[#3b3f6e] outline-none placeholder:text-[#2b2b2f66] focus:border-[#3b3f6e]"
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}

export function InternalEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={`${internalTheme.card} text-center`}>
      <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[#e8e2d4]" />
      <h3 className="text-[15px] font-semibold text-[#3b3f6e]">{title}</h3>
      <p
        className={`mx-auto mt-1 max-w-[260px] text-[13px] leading-5 ${internalTheme.faint}`}
      >
        {description}
      </p>
    </div>
  );
}

export function InternalConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
}: {
  title: string;
  description: string;
  confirmLabel?: string;
}) {
  return (
    <div className={`${internalTheme.card} border-[#e8a84a66]`}>
      <p className="text-[14px] font-semibold text-[#3b3f6e]">{title}</p>
      <p className={`mt-1 text-[12px] leading-5 ${internalTheme.muted}`}>
        {description}
      </p>
      <button
        className="mt-3 h-10 w-full rounded-[10px] bg-[#3b3f6e] text-[13px] font-semibold text-[#f7f1e6]"
        type="button"
      >
        {confirmLabel}
      </button>
    </div>
  );
}

export function InternalPagination({
  onPageChange,
  page,
  pageCount,
  pageSize,
  total,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}) {
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#e0d9ce] bg-white px-3 py-2 text-[12px] text-[#3b3f6e] shadow-sm">
      <p className={internalTheme.faint}>
        Showing {start}-{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="h-8 rounded-[9px] border border-[#3b3f6e33] px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          type="button"
        >
          Prev
        </button>
        <span className="min-w-12 text-center font-semibold">
          {page}/{pageCount}
        </span>
        <button
          className="h-8 rounded-[9px] border border-[#3b3f6e33] px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page >= pageCount}
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function InternalModal({
  children,
  description,
  onClose,
  title,
}: {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-end bg-[#2b2b2f66] px-3 pb-3 pt-16 backdrop-blur-sm md:items-center md:justify-center md:p-6"
      role="dialog"
    >
      <div className="max-h-[82vh] w-full max-w-[620px] overflow-hidden rounded-[20px] border border-[#e0d9ce] bg-[#f7f1e6] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#e0d9ce] bg-white px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-[16px] font-bold text-[#3b3f6e]">
              {title}
            </h3>
            {description ? (
              <p className={`mt-1 text-[12px] ${internalTheme.faint}`}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Close details"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e0d9ce] text-[20px] leading-none text-[#3b3f6e]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="max-h-[calc(82vh-64px)] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
