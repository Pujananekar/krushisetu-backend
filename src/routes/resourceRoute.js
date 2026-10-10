import express from "express"
import {   } from "../controllers/adminController/resourceController.js"
import { getPublicResourceBySlug, getPublicResources } from "../controllers/resourceController.js"

const router = express.Router()

router.get("/",getPublicResources)
router.get("/:slug",getPublicResourceBySlug)

export default router