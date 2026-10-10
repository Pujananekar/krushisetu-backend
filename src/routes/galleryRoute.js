import express from "express"
import { getPublicGallery, getPublicGalleryBySlug } from "../controllers/galleryController.js"

const router = express.Router()

router.get("/",getPublicGallery)
router.get("/:slug",getPublicGalleryBySlug)

export default router