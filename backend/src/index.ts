import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import { connectDB } from "./db/db.js"
import apiRoutes from "./routes/index.js"

dotenv.config({
    path: ".env"
})

const app = express()

connectDB();

const rawCorsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = rawCorsOrigin
    ? rawCorsOrigin.split(",").map((o) => o.trim().replace(/\/$/, ""))
    : [];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, server-to-server)
            if (!origin) {
                return callback(null, true);
            }

            const cleanOrigin = origin.replace(/\/$/, "");

            // If CORS_ORIGIN is not set, or is "*", reflect origin dynamically so credentials are permitted
            if (!rawCorsOrigin || rawCorsOrigin === "*" || allowedOrigins.includes("*")) {
                return callback(null, true);
            }

            // Exact match (ignoring trailing slash)
            if (allowedOrigins.includes(cleanOrigin)) {
                return callback(null, true);
            }

            // Allow localhost for local development & testing
            if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
                return callback(null, true);
            }

            // Allow Vercel preview & production URLs if vercel.app is configured
            if (
                allowedOrigins.some((o) => o.includes("vercel.app")) &&
                cleanOrigin.endsWith(".vercel.app")
            ) {
                return callback(null, true);
            }

            return callback(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With", "Origin"],
        optionsSuccessStatus: 200,
    })
);

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});


app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});