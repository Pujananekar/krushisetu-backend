import express from "express";
import { getPublicSiteSettings } from "../controllers/siteSettingsController.js";
const router = express.Router()

router.get("/",getPublicSiteSettings)

export default router