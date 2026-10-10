import express from "express"
import { getDepartmentBySlug, getDepartments } from "../controllers/departmentController.js"

const router = express.Router()

router.get("/",getDepartments);
router.get("/:slug", getDepartmentBySlug);

export default router