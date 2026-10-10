import express from "express"
import { getTrainingEventBySlug, getTrainingEvents } from "../controllers/trainingEventController.js"

const router = express.Router()

router.get("/",getTrainingEvents)

router.get("/:slug",getTrainingEventBySlug)

export default router