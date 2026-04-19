/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getDefaultDashboardRoute, isValidRedirectForRole, UserRole } from "@/lib/authUtils";
import { httpClient } from "@/lib/axios/httpClient";
import { setTokenInCookies } from "@/lib/tokenUtils";
import { ApiErrorResponse } from "@/types/api.types";
import { ILoginResponse } from "@/types/auth.types";
import { ILoginPayload, loginZodSchema } from "@/zod/auth.validation";

export interface LoginActionSuccessResponse {
    success: true;
    redirectTo: string;
}

export type LoginActionResponse = LoginActionSuccessResponse | ApiErrorResponse;

export const loginAction = async (payload : ILoginPayload, redirectPath ?: string ) : Promise<LoginActionResponse> =>{
    const parsedPayload = loginZodSchema.safeParse(payload);

    if(!parsedPayload.success){
        const firstError = parsedPayload.error.issues[0].message || "Invalid input";
        return {
            success: false,
            message: firstError,
        }
    }
    try {

        const response = await httpClient.post<ILoginResponse>("/auth/login", parsedPayload.data);

        const { accessToken, refreshToken, token, user} = response.data;
        const {role, needPasswordChange, email} = user;
        await setTokenInCookies("accessToken", accessToken);
        await setTokenInCookies("refreshToken", refreshToken);
        await setTokenInCookies("better-auth.session_token", token, 24 * 60 * 60); // 1 day in seconds

        if(needPasswordChange){
            return {
                success: true,
                redirectTo: `/reset-password?email=${email}`,
            };
        }

        const targetPath = redirectPath && isValidRedirectForRole(redirectPath, role as UserRole) ? redirectPath : getDefaultDashboardRoute(role as UserRole);
        return {
            success: true,
            redirectTo: targetPath,
        };
        
    } catch (error : any) {
        console.log(error, "error");
        if (error && error.response && error.response.data.message === "Email not verified") {
            return {
                success: true,
                redirectTo: `/verify-email?email=${payload.email}`,
            };
        }
        return {
            success: false,
            message: `Login failed: ${error.message}`,
        }
    }
}