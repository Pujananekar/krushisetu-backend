import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "path";
import session from "express-session";

import pool from "./config/db.js";
import sessionConfig from "./config/session.js";

import siteSettingRoute from "./routes/siteSettingsRoute.js"
import departmentRoutes from "./routes/departmentRoutes.js";
import resourceRoutes from "./routes/resourceRoute.js"
import projectRoutes from "./routes/projectRoute.js"
import impactRoutes from "./routes/impactRoute.js"
import successStoriesRoute from "./routes/successStoryRoute.js"
import newsRoute from "./routes/newsRoute.js"
import galleryRoute from "./routes/galleryRoute.js"

import contactRoute from "./routes/contactRoute.js";
import applicationRoute from "./routes/applicationRoute.js";
import adminRoute from "./routes/adminRoute.js";
import schemesRoute from "./routes/schemesRoute.js";
import trainingEventsRoute from "./routes/trainingEventRoute.js";

const app = express();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Session
|--------------------------------------------------------------------------
*/

app.use(session(sessionConfig));

/*
|--------------------------------------------------------------------------
| Static Uploads
|--------------------------------------------------------------------------
*/

app.use(
    "/uploads",
    express.static(
        path.join(process.cwd(), "uploads")
    )
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/api/health", async (req, res) => {
    try {
        const [result] = await pool.query(
            "SELECT 1 AS connected"
        );

        res.json({
            success: true,
            message: "Krushisetu API is running......",
            database:
                result[0].connected === 1
                    ? "CONNECTED..."
                    : "NOT CONNECTED..!",
        });
    } catch (error) {
        console.error(
            "Database connection error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Database connection failed..!!!",
        });
    }
});

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

app.use("/api/site-settings",siteSettingRoute)

app.use(
    "/api/departments",
    departmentRoutes
);

app.use("/api/resources",resourceRoutes)
app.use("/api/projects",projectRoutes)
app.use("/api/impact",impactRoutes)
app.use("/api/success-stories",successStoriesRoute)
app.use("/api/gallery",galleryRoute)
app.use("/api/news",newsRoute)


app.use(
    "/api/contact",
    contactRoute
);

app.use(
    "/api/applications",
    applicationRoute
);

app.use(
    "/api/schemes",
    schemesRoute
);

app.use(
    "/api/training-events",
    trainingEventsRoute
);

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

app.use(
    "/api/admin",
    adminRoute
);

/*
|--------------------------------------------------------------------------
| Server
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Server is running on port : ${PORT}`
    );
});