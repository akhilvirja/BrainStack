import authRoutes from "./auth/auth.route.js"
import contentRoutes from "./content/content.route.js"
import shareRoutes from "./share/share.route.js"
import tagRoutes from "./tag/tag.route.js"
import aiRoutes from "./ai/ai.route.js"
import express from "express"
const router = express.Router()

router.use("/auth", authRoutes)
router.use("/content", contentRoutes)
router.use("/share", shareRoutes)
router.use("/tags", tagRoutes)
router.use("/ai", aiRoutes)

export default router