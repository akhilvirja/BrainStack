import type { NextFunction, Request, Response } from "express"
import { z } from "zod"
import { sendErrorResponse } from "../utils/response.js";

export const validate = (schema: z.ZodType) => {
    return async (req : Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            console.log(error)
            if (error instanceof z.ZodError){
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }))
                return sendErrorResponse(res, 400, formattedErrors, "Validation failed");
            }

            return next(error)
        }
    }
}