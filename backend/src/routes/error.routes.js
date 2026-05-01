import { Router } from "express";
import { logError, getErrors } from "../contollers/error.controller.js";

const router = Router();

router.post("/", logError);
router.get("/", getErrors);

export default router;
