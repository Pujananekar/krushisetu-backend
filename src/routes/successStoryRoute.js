import express from "express"
import { getPublicSuccessStories, getPublicSuccessStoryBySlug } from "../controllers/successStoryController.js"

const router = express.Router()

router.get("/",getPublicSuccessStories)
router.get("/:slug",getPublicSuccessStoryBySlug)

export default router