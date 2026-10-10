import express from "express";
import { getProjectBySlug, getProjects } from "../controllers/projectController.js";



const router = express.Router();

router.get("/", getProjects);

router.get("/:slug", getProjectBySlug);

export default router;