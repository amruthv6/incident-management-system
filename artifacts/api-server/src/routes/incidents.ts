import { Router } from "express";
import { requireMongo } from "../middlewares/requireMongo";
import mongoose from "mongoose";
import { Incident } from "../models/incident";
import { Employee } from "../models/employee";
import {
  ListIncidentsQueryParams,
  CreateIncidentBody,
  GetIncidentParams,
  UpdateIncidentParams,
  UpdateIncidentBody,
  DeleteIncidentParams,
  UpdateIncidentStatusParams,
  UpdateIncidentStatusBody,
  GetIncidentLogsParams,
  AddIncidentLogParams,
  AddIncidentLogBody,
} from "@workspace/api-zod";

const router = Router();

router.use(requireMongo);

function mapIncident(i: InstanceType<typeof Incident>) {
  return {
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
  };
}

router.get("/", async (req, res) => {
  const query = ListIncidentsQueryParams.parse(req.query);
  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.status) {
    filter.status = query.status;
  }
  if (query.priority) {
    filter.priority = query.priority;
  }
  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Incident.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Incident.countDocuments(filter),
  ]);

  res.json({ data: data.map(mapIncident), total, page, limit });
});

router.post("/", async (req, res) => {
  const body = CreateIncidentBody.parse(req.body);

  let assignedToName: string | undefined;
  if (body.assignedTo) {
    const emp = await Employee.findById(body.assignedTo);
    assignedToName = emp?.name;
  }

  const incident = new Incident({ ...body, assignedToName });
  await incident.save();

  incident.logs.push({
    _id: new mongoose.Types.ObjectId(),
    action: "Incident created",
    note: `Priority: ${body.priority}`,
    updatedBy: body.reportedByName,
    timestamp: new Date(),
  });
  await incident.save();

  res.status(201).json(mapIncident(incident));
});

router.get("/:id", async (req, res) => {
  const { id } = GetIncidentParams.parse(req.params);
  const incident = await Incident.findById(id);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  res.json(mapIncident(incident));
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateIncidentParams.parse(req.params);
  const body = UpdateIncidentBody.parse(req.body);

  let assignedToName: string | undefined;
  if (body.assignedTo) {
    const emp = await Employee.findById(body.assignedTo);
    assignedToName = emp?.name;
  }

  const incident = await Incident.findByIdAndUpdate(
    id,
    { ...body, ...(assignedToName ? { assignedToName } : {}) },
    { new: true }
  );
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  res.json(mapIncident(incident));
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteIncidentParams.parse(req.params);
  const incident = await Incident.findByIdAndDelete(id);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  res.status(204).send();
});

router.patch("/:id/status", async (req, res) => {
  const { id } = UpdateIncidentStatusParams.parse(req.params);
  const body = UpdateIncidentStatusBody.parse(req.body);

  const incident = await Incident.findById(id);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  const prevStatus = incident.status;
  incident.status = body.status;
  if (body.status === "resolved") {
    incident.resolvedAt = new Date();
  }

  incident.logs.push({
    _id: new mongoose.Types.ObjectId(),
    action: `Status changed: ${prevStatus} → ${body.status}`,
    note: body.note,
    updatedBy: body.updatedBy ?? "System",
    timestamp: new Date(),
  });

  await incident.save();
  res.json(mapIncident(incident));
});

router.get("/:id/logs", async (req, res) => {
  const { id } = GetIncidentLogsParams.parse(req.params);
  const incident = await Incident.findById(id);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }
  const logs = incident.logs
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .map((l) => ({
      id: l._id.toString(),
      incidentId: id,
      action: l.action,
      note: l.note,
      updatedBy: l.updatedBy,
      timestamp: l.timestamp.toISOString(),
    }));
  res.json(logs);
});

router.post("/:id/logs", async (req, res) => {
  const { id } = AddIncidentLogParams.parse(req.params);
  const body = AddIncidentLogBody.parse(req.body);

  const incident = await Incident.findById(id);
  if (!incident) {
    res.status(404).json({ error: "Incident not found" });
    return;
  }

  const logId = new mongoose.Types.ObjectId();
  incident.logs.push({
    _id: logId,
    action: body.action,
    note: body.note,
    updatedBy: body.updatedBy,
    timestamp: new Date(),
  });
  await incident.save();

  const log = incident.logs[incident.logs.length - 1];
  res.status(201).json({
    id: log._id.toString(),
    incidentId: id,
    action: log.action,
    note: log.note,
    updatedBy: log.updatedBy,
    timestamp: log.timestamp.toISOString(),
  });
});

export default router;
