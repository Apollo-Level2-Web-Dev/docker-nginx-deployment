"use server"

import {
    createSchedule,
    deleteSchedule,
    getScheduleById,
    updateSchedule,
} from "@/services/schedule.services"
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types"
import {
    type ICreateSchedulePayload,
    type ISchedule,
    type IUpdateSchedulePayload,
} from "@/types/schedule.types"
import {
    createScheduleServerZodSchema,
    updateScheduleServerZodSchema,
} from "@/zod/schedule.validation"

const getActionErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}

export const createScheduleAction = async (
  payload: ICreateSchedulePayload,
): Promise<ApiResponse<ISchedule[]> | ApiErrorResponse> => {
  const parsedPayload = createScheduleServerZodSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return {
      success: false,
      message: parsedPayload.error.issues[0]?.message || "Invalid input",
    }
  }

  try {
    return await createSchedule(parsedPayload.data)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to create schedules"),
    }
  }
}

export const updateScheduleAction = async (
  id: string,
  payload: IUpdateSchedulePayload,
): Promise<ApiResponse<ISchedule> | ApiErrorResponse> => {
  if (!id) {
    return {
      success: false,
      message: "Invalid schedule id",
    }
  }

  const parsedPayload = updateScheduleServerZodSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return {
      success: false,
      message: parsedPayload.error.issues[0]?.message || "Invalid input",
    }
  }

  try {
    return await updateSchedule(id, parsedPayload.data)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to update schedule"),
    }
  }
}

export const deleteScheduleAction = async (
  id: string,
): Promise<ApiResponse<boolean> | ApiErrorResponse> => {
  if (!id) {
    return {
      success: false,
      message: "Invalid schedule id",
    }
  }

  try {
    return await deleteSchedule(id)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to delete schedule"),
    }
  }
}

export const getScheduleByIdAction = async (
  id: string,
): Promise<ApiResponse<ISchedule> | ApiErrorResponse> => {
  if (!id) {
    return {
      success: false,
      message: "Invalid schedule id",
    }
  }

  try {
    return await getScheduleById(id)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to fetch schedule details"),
    }
  }
}
