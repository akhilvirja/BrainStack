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

const corsOrigin = process.env.CORS_ORIGIN;
app.use(
    cors({
        origin: corsOrigin ? corsOrigin.split(",").map((o) => o.trim()) : "*",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
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