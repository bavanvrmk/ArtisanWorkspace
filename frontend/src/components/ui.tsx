import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="lede">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "info" | "ok";
  children: ReactNode;
}) {
  return <div className={`alert ${kind}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function rupees(n: number | undefined | null) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
