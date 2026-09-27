import React from "react";

interface AccountCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function AccountCard({
  children,
  className = "",
  noPadding = false,
  ...props
}: AccountCardProps) {
  return (
    <div
      className={`bg-white border border-brand-sky-border/60 rounded-xl shadow-xs transition-all ${
        noPadding ? "" : "p-5 sm:p-6 lg:p-7"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
