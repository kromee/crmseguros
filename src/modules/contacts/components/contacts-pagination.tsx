"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function ContactsPagination({ page, totalPages, total, pageSize }: Props) {
  const params = useSearchParams();

  function buildHref(p: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    return `/contacts?${next.toString()}`;
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Mostrar máximo 5 números de página alrededor de la actual
  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
      <p className="text-xs text-slate-400">
        Mostrando {start}–{end} de {total} registros
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page === 1}
          className={`p-1.5 rounded text-slate-500 ${
            page === 1 ? "opacity-40 pointer-events-none" : "hover:bg-slate-100"
          }`}
        >
          &lsaquo;
        </Link>
        {pages.map((n) => (
          <Link
            key={n}
            href={buildHref(n)}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs font-medium ${
              n === page
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-100 text-slate-600"
            }`}
          >
            {n}
          </Link>
        ))}
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          className={`p-1.5 rounded text-slate-500 ${
            page === totalPages ? "opacity-40 pointer-events-none" : "hover:bg-slate-100"
          }`}
        >
          &rsaquo;
        </Link>
      </div>
    </div>
  );
}
