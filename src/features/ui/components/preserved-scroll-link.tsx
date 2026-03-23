"use client";

import Link, { type LinkProps } from "next/link";
import { useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";

const SCROLL_KEY = "recipe-rail-scroll-y";

type PreservedScrollLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
  };

export function PreservedScrollLink({
  children,
  onClick,
  scroll = false,
  ...props
}: PreservedScrollLinkProps) {
  useEffect(() => {
    const stored = window.sessionStorage.getItem(SCROLL_KEY);

    if (!stored) {
      return;
    }

    window.sessionStorage.removeItem(SCROLL_KEY);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: Number(stored), behavior: "auto" });
    });
  }, []);

  return (
    <Link
      {...props}
      onClick={(event) => {
        window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
        onClick?.(event);
      }}
      scroll={scroll}
    >
      {children}
    </Link>
  );
}
