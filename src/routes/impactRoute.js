import express from "express"
import { getPublicImpactIndicatorById, getPublicImpactIndicators } from "../controllers/impactController.js"



const router = express.Router()

router.get("/", getPublicImpactIndicators)

router.get(
    "/:id",
    getPublicImpactIndicatorById
)

export default router