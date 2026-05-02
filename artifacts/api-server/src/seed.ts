import mongoose from "mongoose";
import { Employee } from "./models/employee";
import { Incident } from "./models/incident";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required");
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB");

  await Employee.deleteMany({});
  await Incident.deleteMany({});

  const employees = await Employee.insertMany([
    { name: "Alex Chen", email: "alex.chen@ops.com", department: "IT Operations", role: "Senior SRE", phone: "+1-555-0101", status: "active" },
    { name: "Maria Santos", email: "maria.santos@ops.com", department: "Network", role: "Network Engineer", phone: "+1-555-0102", status: "active" },
    { name: "James O'Brien", email: "james.obrien@ops.com", department: "Security", role: "Security Analyst", phone: "+1-555-0103", status: "active" },
    { name: "Priya Patel", email: "priya.patel@ops.com", department: "DevOps", role: "DevOps Engineer", phone: "+1-555-0104", status: "active" },
    { name: "Carlos Ruiz", email: "carlos.ruiz@ops.com", department: "Infrastructure", role: "Infrastructure Lead", phone: "+1-555-0105", status: "active" },
    { name: "Sarah Kim", email: "sarah.kim@ops.com", department: "Support", role: "L2 Support Engineer", phone: "+1-555-0106", status: "active" },
    { name: "David Okafor", email: "david.okafor@ops.com", department: "Engineering", role: "Platform Engineer", phone: "+1-555-0107", status: "inactive" },
  ]);

  console.log(`Seeded ${employees.length} employees`);

  const now = new Date();

  await Incident.insertMany([
    {
      ticketNumber: "INC-0001",
      title: "Production database CPU spiking at 95%",
      description: "The primary PostgreSQL cluster is experiencing sustained high CPU load. Query performance has degraded significantly and connection pool is nearing exhaustion.",
      priority: "critical",
      status: "investigating",
      category: "Database",
      assignedTo: employees[0]._id.toString(),
      assignedToName: employees[0].name,
      reportedBy: "monitoring-bot",
      reportedByName: "PagerDuty Alert",
      logs: [
        { action: "Incident created", note: "Priority: critical", updatedBy: "PagerDuty Alert", timestamp: new Date(now.getTime() - 3600000) },
        { action: "Status changed: open → investigating", note: "Assigned to on-call SRE", updatedBy: employees[0].name, timestamp: new Date(now.getTime() - 3200000) },
      ],
    },
    {
      ticketNumber: "INC-0002",
      title: "VPN gateway unreachable from EU region",
      description: "Remote employees in EU offices cannot establish VPN connections. Issue began after the 02:00 UTC maintenance window.",
      priority: "high",
      status: "open",
      category: "Network",
      assignedTo: employees[1]._id.toString(),
      assignedToName: employees[1].name,
      reportedBy: "helpdesk-001",
      reportedByName: "Help Desk",
      logs: [
        { action: "Incident created", note: "Priority: high", updatedBy: "Help Desk", timestamp: new Date(now.getTime() - 7200000) },
      ],
    },
    {
      ticketNumber: "INC-0003",
      title: "Suspicious login attempts on admin portal",
      description: "Multiple failed login attempts detected from unknown IPs targeting the admin dashboard. Possible brute-force attack in progress.",
      priority: "critical",
      status: "investigating",
      category: "Security",
      assignedTo: employees[2]._id.toString(),
      assignedToName: employees[2].name,
      reportedBy: "siem-system",
      reportedByName: "SIEM Alert",
      logs: [
        { action: "Incident created", note: "Priority: critical", updatedBy: "SIEM Alert", timestamp: new Date(now.getTime() - 1800000) },
        { action: "Status changed: open → investigating", updatedBy: employees[2].name, timestamp: new Date(now.getTime() - 1500000) },
        { action: "IP range blocked at firewall", note: "Blocked 182.51.0.0/16", updatedBy: employees[2].name, timestamp: new Date(now.getTime() - 1200000) },
      ],
    },
    {
      ticketNumber: "INC-0004",
      title: "CI/CD pipeline failing on deployment step",
      description: "The main deployment pipeline for the payment service is failing at the Kubernetes rollout step. Error: ImagePullBackOff on production cluster.",
      priority: "high",
      status: "open",
      category: "DevOps",
      assignedTo: employees[3]._id.toString(),
      assignedToName: employees[3].name,
      reportedBy: "dev-team",
      reportedByName: "Development Team",
      logs: [
        { action: "Incident created", note: "Priority: high", updatedBy: "Development Team", timestamp: new Date(now.getTime() - 5400000) },
      ],
    },
    {
      ticketNumber: "INC-0005",
      title: "Storage array disk failure — redundancy degraded",
      description: "One disk in RAID-6 array SAN-PROD-02 has failed. System is operating in degraded mode. Replacement required before another failure causes data loss.",
      priority: "high",
      status: "resolved",
      category: "Infrastructure",
      assignedTo: employees[4]._id.toString(),
      assignedToName: employees[4].name,
      reportedBy: "storage-monitor",
      reportedByName: "Storage Monitor",
      resolvedAt: new Date(now.getTime() - 86400000),
      logs: [
        { action: "Incident created", note: "Priority: high", updatedBy: "Storage Monitor", timestamp: new Date(now.getTime() - 172800000) },
        { action: "Status changed: open → investigating", updatedBy: employees[4].name, timestamp: new Date(now.getTime() - 170000000) },
        { action: "Replacement disk ordered", note: "ETA: 4 hours", updatedBy: employees[4].name, timestamp: new Date(now.getTime() - 160000000) },
        { action: "Status changed: investigating → resolved", note: "Disk replaced, RAID rebuild complete", updatedBy: employees[4].name, timestamp: new Date(now.getTime() - 86400000) },
      ],
    },
    {
      ticketNumber: "INC-0006",
      title: "Email delivery delays — SMTP queue buildup",
      description: "Customer-facing transactional emails are experiencing 15-30 minute delays. SMTP queue has 12,000 pending messages.",
      priority: "medium",
      status: "resolved",
      category: "Infrastructure",
      reportedBy: "customer-success",
      reportedByName: "Customer Success",
      resolvedAt: new Date(now.getTime() - 43200000),
      logs: [
        { action: "Incident created", note: "Priority: medium", updatedBy: "Customer Success", timestamp: new Date(now.getTime() - 86400000) },
        { action: "Status changed: open → resolved", note: "Queue cleared, delivery normalized", updatedBy: "System", timestamp: new Date(now.getTime() - 43200000) },
      ],
    },
    {
      ticketNumber: "INC-0007",
      title: "API gateway rate limiter misconfigured",
      description: "After last night's config push, the rate limiter is applying overly strict limits to partner API keys, causing 429 errors for legitimate traffic.",
      priority: "medium",
      status: "open",
      category: "Network",
      reportedBy: "api-team",
      reportedByName: "API Team",
      logs: [
        { action: "Incident created", note: "Priority: medium", updatedBy: "API Team", timestamp: new Date(now.getTime() - 10800000) },
      ],
    },
    {
      ticketNumber: "INC-0008",
      title: "SSL certificate expiry warning — 14 days",
      description: "SSL certificate for api.example.com expires in 14 days. Auto-renewal script failed silently last week.",
      priority: "low",
      status: "open",
      category: "Security",
      reportedBy: "cert-monitor",
      reportedByName: "Certificate Monitor",
      logs: [
        { action: "Incident created", note: "Priority: low", updatedBy: "Certificate Monitor", timestamp: new Date(now.getTime() - 86400000) },
      ],
    },
  ]);

  console.log("Seeded 8 incidents");
  await mongoose.disconnect();
  console.log("Done! Database seeded successfully.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
