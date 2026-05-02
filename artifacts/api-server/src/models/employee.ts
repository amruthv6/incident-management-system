import mongoose, { Schema, Document } from "mongoose";

export interface IEmployee extends Document {
  name: string;
  email: string;
  department: string;
  role: string;
  phone?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

employeeSchema.index({ name: "text", email: "text", department: "text", role: "text" });

export const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);
