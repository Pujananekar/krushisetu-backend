import express from "express"
import { createFarmerApplication } from "../controllers/farmerApplicationController.js"
import { createTrainingApplication } from "../controllers/trainingApplicationController.js"
import { createServiceApplication } from "../controllers/serviceApplicationController.js"
import { createInternshipApplication } from "../controllers/internshipApplicationController.js"
import { createFPOApplication } from "../controllers/fpoApplicationController.js"
import { createPartnershipApplication } from "../controllers/partnershipApplicationController.js"
import { createVolunteerApplication } from "../controllers/volunteerApplicationController.js"


const router = express.Router()

router.post("/farmer",createFarmerApplication)
router.post("/training",createTrainingApplication)
router.post("/service",createServiceApplication)
router.post("/internship",createInternshipApplication)
router.post("/fpo",createFPOApplication)
router.post("/partnership",createPartnershipApplication)
router.post("/volunteer",createVolunteerApplication)

export default router