import { Router } from "express";
import { Employee } from "../models/employee";
import {
  ListEmployeesQueryParams,
  CreateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  UpdateEmployeeBody,
  DeleteEmployeeParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListEmployeesQueryParams.parse(req.query);
  const filter: Record<string, unknown> = {};

  if (query.search) {
    filter.$text = { $search: query.search };
  }
  if (query.department) {
    filter.department = { $regex: query.department, $options: "i" };
  }
  if (query.role) {
    filter.role = { $regex: query.role, $options: "i" };
  }

  const employees = await Employee.find(filter).sort({ createdAt: -1 });
  const mapped = employees.map((e) => ({
    id: e._id.toString(),
    name: e.name,
    email: e.email,
    department: e.department,
    role: e.role,
    phone: e.phone,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));
  res.json(mapped);
});

router.post("/", async (req, res) => {
  const body = CreateEmployeeBody.parse(req.body);
  const employee = new Employee(body);
  await employee.save();
  res.status(201).json({
    id: employee._id.toString(),
    name: employee.name,
    email: employee.email,
    department: employee.department,
    role: employee.role,
    phone: employee.phone,
    status: employee.status,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const { id } = GetEmployeeParams.parse(req.params);
  const employee = await Employee.findById(id);
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json({
    id: employee._id.toString(),
    name: employee.name,
    email: employee.email,
    department: employee.department,
    role: employee.role,
    phone: employee.phone,
    status: employee.status,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  });
});

router.put("/:id", async (req, res) => {
  const { id } = UpdateEmployeeParams.parse(req.params);
  const body = UpdateEmployeeBody.parse(req.body);
  const employee = await Employee.findByIdAndUpdate(id, body, { new: true });
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json({
    id: employee._id.toString(),
    name: employee.name,
    email: employee.email,
    department: employee.department,
    role: employee.role,
    phone: employee.phone,
    status: employee.status,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = DeleteEmployeeParams.parse(req.params);
  const employee = await Employee.findByIdAndDelete(id);
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.status(204).send();
});

export default router;
