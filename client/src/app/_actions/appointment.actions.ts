"use server"

import {
  bookAppointment,
  bookAppointmentWithPayLater,
  initiateAppointmentPayment,
} from "@/services/appointment.services"
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types"
import {
  type IBookAppointmentPayload,
  type IBookAppointmentResult,
  type IInitiatePaymentResult,
} from "@/types/appointment.types"
import { bookAppointmentServerZodSchema } from "@/zod/appointment.validation"

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

export const bookAppointmentAction = async (
  payload: IBookAppointmentPayload,
): Promise<ApiResponse<IBookAppointmentResult> | ApiErrorResponse> => {
  const parsedPayload = bookAppointmentServerZodSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return {
      success: false,
      message: parsedPayload.error.issues[0]?.message || "Invalid appointment selection",
    }
  }

  try {
    return await bookAppointment(parsedPayload.data)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to book appointment"),
    }
  }
}

export const bookAppointmentWithPayLaterAction = async (
  payload: IBookAppointmentPayload,
): Promise<ApiResponse<IBookAppointmentResult> | ApiErrorResponse> => {
  const parsedPayload = bookAppointmentServerZodSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return {
      success: false,
      message: parsedPayload.error.issues[0]?.message || "Invalid appointment selection",
    }
  }

  try {
    return await bookAppointmentWithPayLater(parsedPayload.data)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to book appointment with pay later"),
    }
  }
}

export const initiateAppointmentPaymentAction = async (
  appointmentId: string,
): Promise<ApiResponse<IInitiatePaymentResult> | ApiErrorResponse> => {
  if (!appointmentId) {
    return {
      success: false,
      message: "Invalid appointment id",
    }
  }

  try {
    return await initiateAppointmentPayment(appointmentId)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to initiate payment"),
    }
  }
}