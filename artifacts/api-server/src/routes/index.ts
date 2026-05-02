import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import incidentsRouter from "./incidents";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/employees", employeesRouter);
router.use("/incidents", incidentsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
