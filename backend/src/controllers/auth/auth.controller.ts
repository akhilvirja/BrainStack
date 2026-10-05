import bcrypt from "bcrypt"
import { User } from "../../models/user.model.js"
import type { LoginInput, RegisterInput } from "../../schemas/auth.schema.js"
import type { Request, Response } from "express"
import { sendErrorResponse, sendSuccessResponse } from "../../utils/response.js"
import { generateTokenAndSetCookie } from "../../utils/jwtToken.js"

export const register = async (req: Request<{}, {}, RegisterInput>, res: Response) => {
    try {
        const { username, email, password } = req.body

        const existingUser = await User.findOne({email})
        if(existingUser){
            return sendErrorResponse(res, 400, null, "User already exists")
        }

        const newUser = await User.create({
            username,
            email,
            password,
        })

        const token = generateTokenAndSetCookie(res, newUser._id)

        const createdUser = await User.findById(newUser._id).select("-password")

        return sendSuccessResponse(
            res,
            201,
            createdUser,
            "User registered successfully",
            token
        )

    } catch (error) {
        console.error("Error in register", error)
        return sendErrorResponse(res, 500, null, "Internal server error")
    }
}

export const login = async (req: Request<{}, {}, LoginInput>, res: Response) => {
    try {
        const {email, password} = req.body

        const user = await User.findOne({email})

        if(!user){
            return sendErrorResponse(res, 401, null, "Invalid email or password")
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if(!isPasswordValid){
            return sendErrorResponse(res, 401, null, "Invalid email or password")
        }

        const token = generateTokenAndSetCookie(res, user._id)

        const loggedInUser = await User.findById(user._id).select("-password")

        return sendSuccessResponse(
            res,
            200,
            loggedInUser,
            "User logged in successfully",
            token
        )
    } catch (error) {
        console.error("Error in login", error)
        return sendErrorResponse(res, 500, null, "Internal server error")
    }
}

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("jwt")
        return sendSuccessResponse(
            res,
            200,
            null,
            "User logged out successfully"
        )
    } catch (error) {
        console.error("Error in logout", error)
        return sendErrorResponse(res, 500, null, "Internal server error")
    }
}