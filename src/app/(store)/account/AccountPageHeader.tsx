"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface AccountPageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  className?: string;
}

export function AccountPageHeader({
  title,
  subtitle,
  backHref,
  className = "",
}: AccountPageHeaderProps) {
  return (
    <div className={`mb-8 sm:mb-10 max-w-[900px] ${className}`}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 mb-3 text-xs font-mono uppercase tracking-wider text-brand-gray-500 hover:text-brand-navy transition-colors group"
        >
          <ChevronLeft
            size={14}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          <span>Back</span>
        </Link>
      )}
      <h1 className="font-serif text-3xl sm:text-4xl text-brand-dark tracking-tight leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm sm:text-base text-brand-gray-500 mt-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
