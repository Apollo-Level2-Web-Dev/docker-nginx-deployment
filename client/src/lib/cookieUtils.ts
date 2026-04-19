"use server";

import { cookies } from "next/headers";

const shouldUseSecureCookies = () => {
    // Keep secure cookies for real production traffic, but allow HTTP deployments (no TLS yet).
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
    return appUrl.startsWith("https://");
};

export const setCookie = async (
    name : string,
    value : string,
    maxAgeInSeconds : number,
) => {
    const cookieStore = await cookies();

    cookieStore.set(name, value, {
        httpOnly : true,
        secure : shouldUseSecureCookies(),
        sameSite : "lax",
        path : "/",
        maxAge : maxAgeInSeconds,
    })
}

export const getCookie = async (name : string) => {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
}

export const deleteCookie = async (name : string) => {
    const cookieStore = await cookies();
    cookieStore.delete(name);
}