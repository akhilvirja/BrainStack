import express from "express"
import { login, logout, register } from "../../../controllers/auth/auth.controller.js"
import { validate } from "../../../middlewares/validate.middleware.js"
import { loginSchema, registerSchema } from "../../../schemas/auth.schema.js"
const router = express.Router()

router.post("/register", validate(registerSchema), register)
router.post("/signin", validate(loginSchema), login)
router.post("/logout", logout)

export default router