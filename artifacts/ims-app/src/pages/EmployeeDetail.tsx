import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetEmployee,
  useUpdateEmployee,
  useListIncidents,
  getGetEmployeeQueryKey,
  getListIncidentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Phone, Building2, Briefcase, UserCircle } from "lucide-react";
import { Link } from "wouter";
import { format, formatDistanceToNow } from "date-fns";

const DEPARTMENTS = ["Engineering", "IT Operations", "Network", "Security", "Infrastructure", "DevOps", "Support", "Management"];

export default function EmployeeDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", department: "", role: "", phone: "", status: "active" });

  const { data: employee, isLoading } = useGetEmployee(id, {
    query: { enabled: !!id, queryKey: getGetEmployeeQueryKey(id) },
  });
  const { data: incidentData } = useListIncidents({ assignedTo: id, limit: 50 }, {
    query: { enabled: !!id, queryKey: getListIncidentsQueryKey({ assignedTo: id, limit: 50 }) },
  });
  const updateEmployee = useUpdateEmployee();

  function openEdit() {
    if (!employee) return;
    setEditForm({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      phone: employee.phone ?? "",
      status: employee.status,
    });
    setShowEdit(true);
  }

  function handleEdit() {
    updateEmployee.mutate(
      { id, data: { ...editForm, phone: editForm.phone || undefined, status: editForm.status as "active" | "inactive" } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetEmployeeQueryKey(id) });
          setShowEdit(false);
          toast({ title: "Employee updated" });
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

  if (!employee) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>Employee not found.</p>
        <Button variant="link" onClick={() => setLocation("/employees")}>Back</Button>
      </div>
    );
  }

  const incidents = incidentData?.data ?? [];

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/employees")} data-testid="button-back-employees">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={openEdit} data-testid="button-edit-employee">Edit</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{employee.name}</h1>
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${employee.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
              {employee.status}
            </span>
          </div>
          <div className="mt-5 space-y-3 border-t border-card-border pt-4">
            <div className="flex items-center gap-2.5 text-sm">
              <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground/80 truncate">{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground/80">{employee.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-sm">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground/80">{employee.department}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground/80">{employee.role}</span>
            </div>
          </div>
          <div className="mt-4 border-t border-card-border pt-3">
            <p className="text-xs text-muted-foreground">Joined {format(new Date(employee.createdAt), "MMM d, yyyy")}</p>
          </div>
        </div>

        {/* Assigned incidents */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-lg">
          <div className="px-5 py-4 border-b border-card-border">
            <h2 className="text-sm font-semibold text-foreground">Assigned Incidents ({incidents.length})</h2>
          </div>
          {incidents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No incidents assigned</div>
          ) : (
            <div className="divide-y divide-card-border">
              {incidents.map((inc) => (
                <Link key={inc.id} href={`/incidents/${inc.id}`}>
                  <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer" data-testid={`row-assigned-incident-${inc.id}`}>
                    <span className="text-xs font-mono text-muted-foreground w-20 flex-shrink-0">{inc.ticketNumber}</span>
                    <span className="flex-1 text-sm text-foreground truncate">{inc.title}</span>
                    <PriorityBadge priority={inc.priority as "low" | "medium" | "high" | "critical"} />
                    <StatusBadge status={inc.status as "open" | "investigating" | "resolved"} />
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(inc.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input className="mt-1.5" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} data-testid="input-edit-emp-name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1.5" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} data-testid="input-edit-emp-email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Department</Label>
                <Select value={editForm.department} onValueChange={(v) => setEditForm({ ...editForm, department: v })}>
                  <SelectTrigger className="mt-1.5" data-testid="select-edit-emp-dept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role</Label>
                <Input className="mt-1.5" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} data-testid="input-edit-emp-role" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input className="mt-1.5" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} data-testid="input-edit-emp-phone" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger className="mt-1.5" data-testid="select-edit-emp-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateEmployee.isPending} data-testid="button-save-emp">
              {updateEmployee.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
