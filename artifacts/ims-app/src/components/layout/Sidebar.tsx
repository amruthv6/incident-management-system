import { Link, useLocation } from "wouter";
import { LayoutDashboard, AlertCircle, Users, ChevronRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: AlertCircle },
  { href: "/employees", label: "Employees", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="w-7 h-7 bg-primary rounded flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground leading-none">OpsCenter</p>
          <p className="text-[10px] text-sidebar-foreground/50 mt-0.5 leading-none">Incident Management</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div
                data-testid={`nav-${label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors group",
                  isActive
                    ? "bg-primary/20 text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/30 font-mono uppercase tracking-widest">v1.0.0 — Operations</p>
      </div>
    </aside>
  );
}
