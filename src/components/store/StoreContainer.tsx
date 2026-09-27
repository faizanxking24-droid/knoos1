import React from "react";

interface StoreContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "header" | "footer";
}

export function StoreContainer({
  children,
  className = "",
  as: Component = "div",
}: StoreContainerProps) {
  return (
    <Component className={`max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-8 xl:px-10 ${className}`}>
      {children}
    </Component>
  );
}
