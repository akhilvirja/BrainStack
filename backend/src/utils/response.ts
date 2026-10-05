import type { Response } from "express";

export const sendSuccessResponse = (
    res: Response, 
    status: number, 
    data: any = null, 
    message: string, 
    token: string = ""
) => {
    if (token) {
        return res.status(status).json({
            success: true,
            data,
            meta: {
                code: 1,
                status,
                message: message,
                token,
            }
        });
    } else {
        return res.status(status).json({
            success: true,
            data,
            meta: {
                code: 1,
                status,
                message: message,
            }
        });
    }
}

export const sendErrorResponse = (
    res: Response, 
    status: number, 
    data: any = null, 
    message: string = "Internal Server Error"
) => {
    return res.status(status).json({
        success: false,
        data,
        meta: {
            code: 0,
            status,
            message,
        }
    });
}