import Link from "next/link";

type WorkspaceStageNavProps = {
  current: "landing" | "company" | "people";
};

const navItems = [
  { href: "/search", key: "landing", label: "Search home" },
  { href: "/search/company", key: "company", label: "Company workflow" },
  { href: "/search/people", key: "people", label: "People workflow" },
] as const;

export function WorkspaceStageNav({ current }: WorkspaceStageNavProps) {
  return (
    <nav className="tab-bar" aria-label="Search workflow navigation">
      {navItems.map((item) => (
        <Link
          key={item.key}
          className={`tab-pill${item.key === current ? " active" : ""}`}
          href={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
