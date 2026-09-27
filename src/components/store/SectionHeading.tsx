import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  viewAllHref?: string;
  viewAllText?: string;
  centered?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  viewAllHref,
  viewAllText = "View All",
  centered = false,
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col ${
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"
      } mb-8 sm:mb-12 gap-4 ${className}`}
    >
      <div className={centered ? "max-w-2xl mx-auto" : "max-w-2xl"}>
        {eyebrow && (
          <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.2em] text-brand-blue font-medium mb-2.5">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-brand-dark tracking-tight leading-[1.15]">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-brand-gray-600 text-sm sm:text-base font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {viewAllHref && !centered && (
        <div className="pt-2 md:pt-0 self-start md:self-end shrink-0">
          <Link
            href={viewAllHref}
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand-dark hover:text-brand-blue pb-1 border-b border-brand-dark/20 hover:border-brand-blue transition-all duration-300"
          >
            <span>{viewAllText}</span>
            <ArrowRight
              size={13}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>
      )}
    </div>
  );
}
