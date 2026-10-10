import express from "express"
import { getPublicNews, getPublicNewsBySlug } from "../controllers/newsController.js"



const router = express.Router()

router.get("/", getPublicNews)

router.get("/:slug", getPublicNewsBySlug)

export default router