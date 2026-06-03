"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function TenantsPagination({ page, totalPages, total, pageSize }: Props) {
  const params = useSearchParams();

  function buildHref(p: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    return `/platform/tenants?${next.toString()}`;
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-theme-subtle">
      <p className="text-xs text-theme-muted">
        Mostrando {start}–{end} de {total} agencias
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page === 1}
          className={`p-1.5 rounded text-theme-muted ${
            page === 1 ? "opacity-40 pointer-events-none" : "hover:bg-[var(--color-bg-hover)]"
          }`}
        >
          &lsaquo;
        </Link>
        {pages.map((n) => (
          <Link
            key={n}
            href={buildHref(n)}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
              n === page ? "bg-blue-600 text-white" : "hover:bg-[var(--color-bg-hover)] text-theme-secondary"
            }`}
          >
            {n}
          </Link>
        ))}
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          className={`p-1.5 rounded text-theme-muted ${
            page === totalPages ? "opacity-40 pointer-events-none" : "hover:bg-[var(--color-bg-hover)]"
          }`}
        >
          &rsaquo;
        </Link>
      </div>
    </div>
  );
}
