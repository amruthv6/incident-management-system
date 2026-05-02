import mongoose, { Schema, Document } from "mongoose";

export interface IIncidentLog {
  _id: mongoose.Types.ObjectId;
  action: string;
  note?: string;
  updatedBy: string;
  timestamp: Date;
}

export interface IIncident extends Document {
  ticketNumber: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved";
  category?: string;
  assignedTo?: string;
  assignedToName?: string;
  reportedBy: string;
  reportedByName: string;
  resolvedAt?: Date;
  logs: IIncidentLog[];
  createdAt: Date;
  updatedAt: Date;
}

const incidentLogSchema = new Schema<IIncidentLog>(
  {
    action: { type: String, required: true },
    note: { type: String },
    updatedBy: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const incidentSchema = new Schema<IIncident>(
  {
    ticketNumber: { type: String, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "investigating", "resolved"],
      default: "open",
    },
    category: { type: String, trim: true },
    assignedTo: { type: String },
    assignedToName: { type: String },
    reportedBy: { type: String, required: true },
    reportedByName: { type: String, required: true },
    resolvedAt: { type: Date },
    logs: { type: [incidentLogSchema], default: [] },
  },
  { timestamps: true }
);

incidentSchema.index({ title: "text", description: "text", category: "text" });

async function generateTicketNumber(): Promise<string> {
  const count = await mongoose.model("Incident").countDocuments();
  const padded = String(count + 1).padStart(4, "0");
  return `INC-${padded}`;
}

incidentSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketNumber) {
    this.ticketNumber = await generateTicketNumber();
  }
  next();
});

export const Incident = mongoose.model<IIncident>("Incident", incidentSchema);
