import express from "express"
import { getSchemeBySlug, getSchemes } from "../controllers/schemeController.js";

const router = express.Router()

router.get("/",getSchemes)
router.get("/:slug",getSchemeBySlug)

export default router;