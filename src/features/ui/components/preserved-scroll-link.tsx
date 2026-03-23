"use client";

import Link, { type LinkProps } from "next/link";
import { useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";

const SCROLL_KEY = "recipe-rail-scroll-y";

declare global {
  interface Window {
    __recipeEditorDirty?: boolean;
  }
}

type PreservedScrollLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    confirmIfRecipeDirty?: boolean;
  };

export function PreservedScrollLink({
  children,
  confirmIfRecipeDirty = false,
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
        if (confirmIfRecipeDirty && window.__recipeEditorDirty) {
          const confirmed = window.confirm(
            "Discard unsaved changes to this recipe?",
          );
          if (!confirmed) {
            event.preventDefault();
            return;
          }
        }
        window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
        onClick?.(event);
      }}
      scroll={scroll}
    >
      {children}
    </Link>
  );
}
