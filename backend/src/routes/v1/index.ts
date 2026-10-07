import authRoutes from "./auth/auth.route.js"
import contentRoutes from "./content/content.route.js"
import shareRoutes from "./share/share.route.js"
import express from "express"
const router = express.Router()

router.use("/auth", authRoutes)
router.use("/content", contentRoutes)
router.use("/share", shareRoutes)

export default router