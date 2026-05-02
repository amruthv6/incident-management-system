import { useGetDashboardStats, useGetRecentIncidents, useGetPriorityBreakdown, useGetStatusBreakdown } from "@workspace/api-client-react";
import { AlertCircle, CheckCircle2, Clock, Users, Zap, AlertTriangle } from "lucide-react";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  investigating: "#f59e0b",
  resolved: "#10b981",
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-5 flex items-start gap-4" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {value ?? <span className="text-muted-foreground">—</span>}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recent, isLoading: recentLoading } = useGetRecentIncidents({ limit: 8 });
  const { data: priority } = useGetPriorityBreakdown();
  const { data: status } = useGetStatusBreakdown();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Real-time incident and workforce overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Incidents"
          value={stats?.totalIncidents}
          icon={AlertCircle}
          accent="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <StatCard
          label="Open"
          value={stats?.openIncidents}
          icon={Clock}
          accent="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
        />
        <StatCard
          label="Investigating"
          value={stats?.investigatingIncidents}
          icon={Zap}
          accent="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
        />
        <StatCard
          label="Resolved"
          value={stats?.resolvedIncidents}
          icon={CheckCircle2}
          accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
        <StatCard
          label="Critical Incidents"
          value={stats?.criticalIncidents}
          icon={AlertTriangle}
          accent="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
        />
        <StatCard
          label="High Priority"
          value={stats?.highPriorityIncidents}
          icon={AlertCircle}
          accent="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
        />
        <StatCard
          label="Total Employees"
          value={stats?.totalEmployees}
          icon={Users}
          accent="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
        />
        <StatCard
          label="Active Staff"
          value={stats?.activeEmployees}
          icon={Users}
          accent="bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority breakdown */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Incidents by Priority</h2>
          {priority && priority.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priority} barSize={28}>
                <XAxis dataKey="priority" tick={{ fontSize: 12, textTransform: "capitalize" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: 6, fontSize: 12 }}
                  formatter={(value, name) => [value, "Incidents"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priority.map((entry) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Status Distribution</h2>
          {status && status.some((s) => s.count > 0) ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={status} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                    {status.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: 6, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {status.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[entry.status] ?? "#94a3b8" }} />
                    <span className="text-foreground capitalize flex-1">{entry.status}</span>
                    <span className="font-semibold tabular-nums">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Recent incidents */}
      <div className="bg-card border border-card-border rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
          <h2 className="text-sm font-semibold text-foreground">Recent Incidents</h2>
          <Link href="/incidents">
            <span className="text-xs text-primary hover:underline cursor-pointer" data-testid="link-view-all-incidents">View all</span>
          </Link>
        </div>
        {recentLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : recent && recent.length > 0 ? (
          <div className="divide-y divide-card-border">
            {recent.map((incident) => (
              <Link key={incident.id} href={`/incidents/${incident.id}`}>
                <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer" data-testid={`row-incident-${incident.id}`}>
                  <span className="text-xs font-mono text-muted-foreground w-20 flex-shrink-0">{incident.ticketNumber}</span>
                  <span className="flex-1 text-sm text-foreground truncate">{incident.title}</span>
                  <PriorityBadge priority={incident.priority as "low" | "medium" | "high" | "critical"} />
                  <StatusBadge status={incident.status as "open" | "investigating" | "resolved"} />
                  <span className="text-xs text-muted-foreground flex-shrink-0 w-24 text-right">
                    {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-muted-foreground text-sm">No incidents yet</div>
        )}
      </div>
    </div>
  );
}
