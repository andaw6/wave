import { Request, Response } from "express";
import { PaginationParams } from "../interfaces/PaginationParams";
import { PaginationResult } from "../interfaces/PaginationResult";

import { IJwtPayload, IRequestAuth } from "../interfaces/AuthInterface";
import { ApiResponse } from "../interfaces/ApiResponse";

export default abstract class Controller {
    protected async trycatch(callback: CallableFunction, res: Response) {
        try {
            await callback();
        } catch (error) {
            // console.log(error);
            res.status(500).json({ message: "Une erreur interne", error: (error as Error).message, data: null });
        }
    }
    
    protected getPaginationParams(req: Request): PaginationParams {
        return {
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 10,
        };
    }

    protected createPaginatedResponse<T>(
        result: PaginationResult<T>,
        message: string,
        params: PaginationParams
    ): ApiResponse<T[]> {
        const totalPages = Math.ceil(result.totalCount / params.limit);

        return {
            data: result.data,
            message,
            error: false,
            pagination: {
                currentPage: params.page,
                itemsPerPage: params.limit,
                totalItems: result.totalCount,
                totalPages,
            },
        };
    }

    protected createSuccesResponse(message: string, data: any): ApiResponse<any> {
        return { data, message, error: false }
    }

    protected createErrorResponse(message: string): ApiResponse<null> {
        return {
            data: null,
            message,
            error: true,
        };
    }

    protected getUserRequest(req: Request): IJwtPayload {
        const authReq = req as IRequestAuth;
        return authReq.user;
    }


}   
