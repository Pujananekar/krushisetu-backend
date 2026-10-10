import express from "express"

import { forgotPassword, login, resetPassword } from "../controllers/adminController/adminAuthController.js"
import { getDashboard } from "../controllers/adminController/dashboardController.js"

import {
    getApplications,
    getApplicationById,
    updateApplication,
} from "../controllers/adminController/applicationController.js"

import {
    getDepartments,
    getDepartmentById,
    updateDepartmentDescription,

    // Beneficiaries
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,

    // Services
    addService,
    updateService,
    deleteService,

    // Process
    addProcessStep,
    updateProcessStep,
    deleteProcessStep,
} from "../controllers/adminController/departmentController.js"
import { createScheme, deleteScheme, getSchemeById, getSchemes, updateScheme } from "../controllers/adminController/adminSchemeController.js"
import { createTrainingEvent, deleteTrainingEvent, getTrainingEventById, getTrainingEvents, updateTrainingEvent } from "../controllers/adminController/trainingEventController.js"
import { createResource, deleteResource, getResourceById, getResources, updateResource } from "../controllers/adminController/resourceController.js"
import { createProject, deleteProject, getProjectById, getProjects, updateProject } from "../controllers/adminController/projectController.js"
import { createImpactIndicator, deleteImpactIndicator, getImpactIndicatorById, getImpactIndicators, updateImpactIndicator } from "../controllers/adminController/impactController.js"
import { createSuccessStoryy, deleteSuccessStoryy, getSuccessStoriess, getSuccessStoryByIdd, updateSuccessStoryy } from "../controllers/adminController/successStoryController.js"
import { createNews, deleteNews, getNews, getNewsById, updateNews } from "../controllers/adminController/newsController.js"
import { createGallery, deleteGallery, getGallery, getGalleryById, updateGallery } from "../controllers/adminController/galleryController.js"
import galleryUpload from "../middleware/galleryUpload.js"
import { uploadGalleryMedia } from "../controllers/adminController/galleryUploadController.js"
import { createAdminUser, deleteAdminUser, getAdminUserById, getAdminUsers, toggleAdminUserStatus, updateAdminUser } from "../controllers/adminController/adminUsersController.js"
import { getPermissions, getRolePermissionMatrix, getRolePermissions, getRoles, updateRolePermissions } from "../controllers/adminController/permissionController.js"
import { getCurrentAdmin, logoutAdmin } from "../controllers/adminController/adminSessionController.js"
import requireAdmin from "../middleware/adminAuthMiddleware.js"
import { getEnquiries, getEnquiryById, updateEnquiryStatus } from "../controllers/adminController/adminEnquiryController.js"
import { getSettings, updateSettings } from "../controllers/adminController/adminSettingsController.js"
import { exportAuditLogs, getAuditLogById, getAuditLogs, getAuditLogStats } from "../controllers/adminController/adminAuditLogController.js"

const router = express.Router()



router.post("/login", login);

router.post(
    "/forgot-password",
    forgotPassword
);

router.post(
    "/reset-password",
    resetPassword
);

router.use(requireAdmin);

router.get("/me", getCurrentAdmin);

router.post("/logout", logoutAdmin);


// Admin Users
router.get("/users", getAdminUsers);
router.get("/users/:id", getAdminUserById);
router.post("/users", createAdminUser);
router.patch("/users/:id", updateAdminUser);
router.patch("/users/:id/status", toggleAdminUserStatus);
router.delete("/users/:id", deleteAdminUser);




router.get("/roles", getRoles);

router.get("/permissions", getPermissions);

router.get("/roles/:role/permissions", getRolePermissions);

router.get("/roles/:role/permissions/matrix", getRolePermissionMatrix);

router.patch("/roles/:role/permissions", updateRolePermissions);


/* =========================================================
   DASHBOARD
========================================================= */

router.get("/dashboard", getDashboard)

/* =========================================================
   DEPARTMENTS
========================================================= */

router.get("/departments", getDepartments)

router.get(
    "/departments/:id",
    getDepartmentById
)

router.patch(
    "/departments/:id",
    updateDepartmentDescription
)

/* =========================================================
   DEPARTMENT - BENEFICIARIES
========================================================= */

router.post(
    "/departments/:id/beneficiaries",
    addBeneficiary
)

router.patch(
    "/departments/:id/beneficiaries/:beneficiaryId",
    updateBeneficiary
)

router.delete(
    "/departments/:id/beneficiaries/:beneficiaryId",
    deleteBeneficiary
)

/* =========================================================
   DEPARTMENT - SERVICES
========================================================= */

router.post(
    "/departments/:id/services",
    addService
)

router.patch(
    "/departments/:id/services/:serviceId",
    updateService
)

router.delete(
    "/departments/:id/services/:serviceId",
    deleteService
)

/* =========================================================
   DEPARTMENT - PROCESS
========================================================= */

router.post(
    "/departments/:id/process",
    addProcessStep
)

router.patch(
    "/departments/:id/process/:processId",
    updateProcessStep
)

router.delete(
    "/departments/:id/process/:processId",
    deleteProcessStep
)

/* =========================================================
   DEPARTMENT - FAQs
========================================================= */


/* =========================================================
   APPLICATIONS
========================================================= */

router.get(
    "/applications",
    getApplications
)

router.get(
    "/applications/:id",
    getApplicationById
)

router.patch(
    "/applications/:id",
    updateApplication
)


router.get("/enquiries", getEnquiries)
router.get("/enquiries/:id", getEnquiryById)
router.patch(
    "/enquiries/:id/status",
    updateEnquiryStatus
)

router.get("/schemes", getSchemes)
router.get("/schemes/:id", getSchemeById)
router.post("/schemes", createScheme)
router.patch("/schemes/:id", updateScheme)
router.delete("/schemes/:id", deleteScheme)

router.get("/training-events", getTrainingEvents)
router.get("/training-events/:id", getTrainingEventById)
router.post("/training-events", createTrainingEvent)
router.patch("/training-events/:id", updateTrainingEvent)
router.delete("/training-events", deleteTrainingEvent)

router.get(
    "/resources",
    getResources
)

router.get(
    "/resources/:id",
    getResourceById
)

router.post(
    "/resources",
    createResource
)

router.patch(
    "/resources/:id",
    updateResource
)

router.delete(
    "/resources/:id",
    deleteResource
)

router.get("/projects", getProjects)

router.get("/projects/:id", getProjectById)

router.post("/projects", createProject)

router.patch("/projects/:id", updateProject)

router.delete("/projects/:id", deleteProject)


router.get("/impact", getImpactIndicators)
router.get("/impact/:id", getImpactIndicatorById)
router.post("/impact", createImpactIndicator)
router.patch("/impact/:id", updateImpactIndicator)
router.delete("/impact/:id", deleteImpactIndicator)

router.get("/success-stories", getSuccessStoriess)

router.get(
    "/success-stories/:id",
    getSuccessStoryByIdd
)

router.post(
    "/success-stories",
    createSuccessStoryy
)

router.patch(
    "/success-stories/:id",
    updateSuccessStoryy
)

router.delete(
    "/success-stories/:id",
    deleteSuccessStoryy
)



router.get("/news", getNews)
router.get("/news/:id", getNewsById)
router.post("/news", createNews)
router.patch("/news/:id", updateNews)
router.delete("/news/:id", deleteNews)




/* =========================================================
   GALLERY
========================================================= */

router.post(
    "/gallery/upload",
    galleryUpload.single("file"),
    uploadGalleryMedia
);

router.get(
    "/gallery",
    getGallery
);

router.get(
    "/gallery/:id",
    getGalleryById
);

router.post(
    "/gallery",
    createGallery
);

router.patch(
    "/gallery/:id",
    updateGallery
);

router.delete(
    "/gallery/:id",
    deleteGallery
);

router.get("/settings", getSettings)
router.patch("/settings", updateSettings)


/* =========================================================
   AUDIT LOGS
========================================================= */

router.get(
    "/audit-logs",
    getAuditLogs
)

router.get(
    "/audit-logs/stats",
    getAuditLogStats
)

router.get(
    "/audit-logs/export",
    exportAuditLogs
)

router.get(
    "/audit-logs/:id",
    getAuditLogById
)


export default router