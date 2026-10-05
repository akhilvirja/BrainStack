import { z } from "zod"

export const registerSchema = z.object({
    body: z.object({
        username: z.string().min(3, "Username must be atleast 3 characters long").max(20, "Username must be atmost 20 characters long"),
        email: z.string().email(),
        password: z.string().min(6, "Password must be atleast 6 characters long"),
    })
})

export type RegisterInput = z.infer<typeof registerSchema>['body'];

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(6, "Password must be atleast 6 characters long"),
    })
})

export type LoginInput = z.infer<typeof loginSchema>['body']