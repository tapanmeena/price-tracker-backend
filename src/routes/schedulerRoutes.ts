import { Request, Response, Router } from "express";
import { schedule } from "node-cron";
import schedulerService from "../services/schedulerService";

const schedulerRouter = Router();

schedulerRouter.post("/start", (req: Request, res: Response) => {
  try {
    const { cronExpression } = req.body;
    schedulerService.startPriceChecker(cronExpression);
    res.status(200).json({ success: true, message: "Scheduler started" });
  } catch (error) {
    console.error("Error starting scheduler:", error);
    res.status(500).json({ success: false, message: "Failed to start scheduler" });
  }
});

schedulerRouter.post("/stop", (req: Request, res: Response) => {
  try {
    schedulerService.stopPriceChecker();
    res.status(200).json({ success: true, message: "Scheduler stopped" });
  } catch (error) {
    console.error("Error stopping scheduler:", error);
    res.status(500).json({ success: false, message: "Failed to stop scheduler" });
  }
});

schedulerRouter.get("/status", (req: Request, res: Response) => {
  try {
    const isRunning = schedulerService.isRunning();
    res.status(200).json({ success: true, isRunning });
  } catch (error) {
    console.error("Error fetching scheduler status:", error);
    res.status(500).json({ success: false, message: "Failed to fetch scheduler status" });
  }
});

schedulerRouter.get("/check-now", async (req: Request, res: Response) => {
  try {
    await schedulerService.triggerManualPriceCheck();
    res.status(200).json({ success: true, message: "Manual price check triggered" });
  } catch (error) {
    console.error("Error checking product prices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check product prices",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default schedulerRouter;
