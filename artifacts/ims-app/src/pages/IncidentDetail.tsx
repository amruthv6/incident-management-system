import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetIncident,
  useGetIncidentLogs,
  useUpdateIncident,
  useUpdateIncidentStatus,
  useAddIncidentLog,
  useListEmployees,
  getGetIncidentQueryKey,
  getGetIncidentLogsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, User, Tag, Activity, Plus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const STATUS_FLOW: Record<string, string[]> = {
  open: ["investigating", "resolved"],
  investigating: ["resolved", "open"],
  resolved: ["open"],
};

export default function IncidentDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [targetStatus, setTargetStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [logAction, setLogAction] = useState("");
  const [logNote, setLogNote] = useState("");

  const { data: incident, isLoading } = useGetIncident(id, {
    query: { enabled: !!id, queryKey: getGetIncidentQueryKey(id) },
  });
  const { data: logs, isLoading: logsLoading } = useGetIncidentLogs(id, {
    query: { enabled: !!id, queryKey: getGetIncidentLogsQueryKey(id) },
  });
  const { data: employees } = useListEmployees();
  const updateStatus = useUpdateIncidentStatus();
  const addLog = useAddIncidentLog();
  const updateIncident = useUpdateIncident();

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "",
    category: "",
    assignedTo: "",
  });

  function openEdit() {
    if (!incident) return;
    setEditForm({
      title: incident.title,
      description: incident.description,
      priority: incident.priority,
      category: incident.category ?? "",
      assignedTo: incident.assignedTo ?? "",
    });
    setShowEditDialog(true);
  }

  function handleStatusChange() {
    updateStatus.mutate(
      { id, data: { status: targetStatus as "open" | "investigating" | "resolved", note: statusNote || undefined, updatedBy: "Operator" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetIncidentQueryKey(id) });
          qc.invalidateQueries({ queryKey: getGetIncidentLogsQueryKey(id) });
          setShowStatusDialog(false);
          setStatusNote("");
          toast({ title: `Status updated to ${targetStatus}` });
        },
        onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
      }
    );
  }

  function handleAddLog() {
    if (!logAction.trim()) return;
    addLog.mutate(
      { id, data: { action: logAction, note: logNote || undefined, updatedBy: "Operator" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetIncidentLogsQueryKey(id) });
          setShowLogDialog(false);
          setLogAction("");
          setLogNote("");
          toast({ title: "Log entry added" });
        },
        onError: () => toast({ title: "Failed to add log", variant: "destructive" }),
      }
    );
  }

  function handleEdit() {
    updateIncident.mutate(
      {
        id,
        data: {
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority as "low" | "medium" | "high" | "critical",
          category: editForm.category || undefined,
          assignedTo: editForm.assignedTo || undefined,
        },
      },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetIncidentQueryKey(id) });
          setShowEditDialog(false);
          toast({ title: "Incident updated" });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Incident not found.</p>
        <Button variant="link" onClick={() => setLocation("/incidents")}>Back to incidents</Button>
      </div>
    );
  }

  const nextStatuses = STATUS_FLOW[incident.status] ?? [];

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/incidents")} className="mt-0.5 flex-shrink-0" data-testid="button-back-incidents">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{incident.ticketNumber}</span>
            <PriorityBadge priority={incident.priority as "low" | "medium" | "high" | "critical"} />
            <StatusBadge status={incident.status as "open" | "investigating" | "resolved"} />
          </div>
          <h1 className="text-xl font-semibold text-foreground mt-1 leading-tight">{incident.title}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={openEdit} data-testid="button-edit-incident">Edit</Button>
      </div>

      {/* Status actions */}
      {nextStatuses.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted/40 rounded-lg border border-card-border">
          <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground mr-2">Advance status:</span>
          {nextStatuses.map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => { setTargetStatus(s); setShowStatusDialog(true); }}
              data-testid={`button-status-${s}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border border-card-border rounded-lg p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Description</h2>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
          </div>

          {/* History log */}
          <div className="bg-card border border-card-border rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
              <h2 className="text-sm font-semibold text-foreground">Activity Log</h2>
              <Button size="sm" variant="outline" onClick={() => setShowLogDialog(true)} data-testid="button-add-log">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add Note
              </Button>
            </div>
            {logsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="divide-y divide-card-border">
                {logs.map((log) => (
                  <div key={log.id} className="px-5 py-3.5 flex gap-3" data-testid={`log-entry-${log.id}`}>
                    <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{log.action}</p>
                      {log.note && <p className="text-sm text-muted-foreground mt-0.5">{log.note}</p>}
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {log.updatedBy} · {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm">No activity yet</div>
            )}
          </div>
        </div>

        {/* Sidebar meta */}
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-foreground font-medium">{incident.category ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned To</p>
                  <p className="text-foreground font-medium">{incident.assignedToName ?? "Unassigned"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Reported By</p>
                  <p className="text-foreground font-medium">{incident.reportedByName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-foreground font-medium">{format(new Date(incident.createdAt), "MMM d, yyyy HH:mm")}</p>
                </div>
              </div>
              {incident.resolvedAt && (
                <div className="flex items-start gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Resolved</p>
                    <p className="text-foreground font-medium">{format(new Date(incident.resolvedAt), "MMM d, yyyy HH:mm")}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status change dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status to "{targetStatus}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Note (optional)</Label>
            <Textarea
              placeholder="Add a note about this status change..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              data-testid="input-status-note"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button onClick={handleStatusChange} disabled={updateStatus.isPending} data-testid="button-confirm-status">
              {updateStatus.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add log dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Log Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Input
                className="mt-1.5"
                placeholder="e.g. Escalated to L2 support"
                value={logAction}
                onChange={(e) => setLogAction(e.target.value)}
                data-testid="input-log-action"
              />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                className="mt-1.5"
                placeholder="Additional details..."
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                data-testid="input-log-note"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLog} disabled={addLog.isPending || !logAction.trim()} data-testid="button-submit-log">
              {addLog.isPending ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input className="mt-1.5" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} data-testid="input-edit-title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1.5" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} data-testid="input-edit-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                  <SelectTrigger className="mt-1.5" data-testid="select-edit-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Input className="mt-1.5" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} data-testid="input-edit-category" />
              </div>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={editForm.assignedTo} onValueChange={(v) => setEditForm({ ...editForm, assignedTo: v })}>
                <SelectTrigger className="mt-1.5" data-testid="select-edit-assigned">
                  <SelectValue placeholder="Select employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name} — {emp.department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateIncident.isPending} data-testid="button-save-edit">
              {updateIncident.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
