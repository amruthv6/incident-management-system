import { useState } from "react";
import {
  useListIncidents,
  useCreateIncident,
  useDeleteIncident,
  useListEmployees,
  getListIncidentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const createSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  reportedBy: z.string().min(1, "Reporter ID required"),
  reportedByName: z.string().min(1, "Reporter name required"),
});

type CreateForm = z.infer<typeof createSchema>;

export default function IncidentList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const params = {
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as "open" | "investigating" | "resolved") : undefined,
    priority: priorityFilter !== "all" ? (priorityFilter as "low" | "medium" | "high" | "critical") : undefined,
    page,
    limit: 20,
  };

  const { data, isLoading } = useListIncidents(params);
  const { data: employees } = useListEmployees();
  const createIncident = useCreateIncident();
  const deleteIncident = useDeleteIncident();

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "",
      assignedTo: "",
      reportedBy: "sys-user",
      reportedByName: "System User",
    },
  });

  function onSubmit(values: CreateForm) {
    createIncident.mutate(
      { data: { ...values, category: values.category || undefined, assignedTo: values.assignedTo || undefined } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListIncidentsQueryKey() });
          setShowCreate(false);
          form.reset();
          toast({ title: "Incident created" });
        },
        onError: () => toast({ title: "Failed to create incident", variant: "destructive" }),
      }
    );
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this incident?")) return;
    deleteIncident.mutate(
      { id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListIncidentsQueryKey() });
          toast({ title: "Incident deleted" });
        },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      }
    );
  }

  const incidents = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Incidents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total incidents</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-incident">
          <Plus className="w-4 h-4 mr-2" />
          New Incident
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            data-testid="input-search-incidents"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40" data-testid="select-priority-filter">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_4fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-muted/50 border-b border-card-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ticket</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</span>
          <span />
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">No incidents found</div>
        ) : (
          <div className="divide-y divide-card-border">
            {incidents.map((inc) => (
              <Link key={inc.id} href={`/incidents/${inc.id}`}>
                <div
                  className="grid grid-cols-[1fr_4fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  data-testid={`row-incident-${inc.id}`}
                >
                  <span className="text-xs font-mono text-muted-foreground">{inc.ticketNumber}</span>
                  <span className="text-sm text-foreground truncate">{inc.title}</span>
                  <PriorityBadge priority={inc.priority as "low" | "medium" | "high" | "critical"} />
                  <StatusBadge status={inc.status as "open" | "investigating" | "resolved"} />
                  <span className="text-xs text-muted-foreground truncate">{inc.assignedToName ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => handleDelete(inc.id, e)}
                      data-testid={`button-delete-incident-${inc.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Incident</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input {...field} data-testid="input-incident-title" placeholder="Brief description of the incident" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea {...field} data-testid="input-incident-description" rows={3} placeholder="Detailed explanation..." /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-incident-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl><Input {...field} data-testid="input-incident-category" placeholder="e.g. Network, Database" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="assignedTo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-incident-assigned">
                        <SelectValue placeholder="Select employee..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name} — {emp.department}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="reportedByName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter Name</FormLabel>
                    <FormControl><Input {...field} data-testid="input-reporter-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reportedBy" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reporter ID</FormLabel>
                    <FormControl><Input {...field} data-testid="input-reporter-id" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={createIncident.isPending} data-testid="button-submit-incident">
                  {createIncident.isPending ? "Creating..." : "Create Incident"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
