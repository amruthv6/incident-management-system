import { Router } from "express";
import { Incident } from "../models/incident";
import { Employee } from "../models/employee";
import { GetRecentIncidentsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/stats", async (_req, res) => {
  const [
    totalIncidents,
    openIncidents,
    investigatingIncidents,
    resolvedIncidents,
    criticalIncidents,
    highPriorityIncidents,
    totalEmployees,
    activeEmployees,
  ] = await Promise.all([
    Incident.countDocuments(),
    Incident.countDocuments({ status: "open" }),
    Incident.countDocuments({ status: "investigating" }),
    Incident.countDocuments({ status: "resolved" }),
    Incident.countDocuments({ priority: "critical" }),
    Incident.countDocuments({ priority: "high" }),
    Employee.countDocuments(),
    Employee.countDocuments({ status: "active" }),
  ]);

  res.json({
    totalIncidents,
    openIncidents,
    investigatingIncidents,
    resolvedIncidents,
    criticalIncidents,
    highPriorityIncidents,
    totalEmployees,
    activeEmployees,
  });
});

router.get("/recent-incidents", async (req, res) => {
  const query = GetRecentIncidentsQueryParams.parse(req.query);
  const limit = query.limit ?? 10;
  const incidents = await Incident.find().sort({ createdAt: -1 }).limit(limit);
  res.json(
    incidents.map((i) => ({
      id: i._id.toString(),
      ticketNumber: i.ticketNumber,
      title: i.title,
      description: i.description,
      priority: i.priority,
      status: i.status,
      category: i.category ?? null,
      assignedTo: i.assignedTo ?? null,
      assignedToName: i.assignedToName ?? null,
      reportedBy: i.reportedBy,
      reportedByName: i.reportedByName,
      resolvedAt: i.resolvedAt ? i.resolvedAt.toISOString() : null,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    }))
  );
});

router.get("/priority-breakdown", async (_req, res) => {
  const breakdown = await Incident.aggregate([
    { $group: { _id: "$priority", count: { $sum: 1 } } },
    { $project: { _id: 0, priority: "$_id", count: 1 } },
  ]);
  const priorities = ["low", "medium", "high", "critical"];
  const result = priorities.map((p) => ({
    priority: p,
    count: breakdown.find((b) => b.priority === p)?.count ?? 0,
  }));
  res.json(result);
});

router.get("/status-breakdown", async (_req, res) => {
  const breakdown = await Incident.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);
  const statuses = ["open", "investigating", "resolved"];
  const result = statuses.map((s) => ({
    status: s,
    count: breakdown.find((b) => b.status === s)?.count ?? 0,
  }));
  res.json(result);
});

export default router;
