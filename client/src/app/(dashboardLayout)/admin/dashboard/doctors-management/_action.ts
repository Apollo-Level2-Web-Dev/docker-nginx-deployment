"use server"

import { createDoctor, deleteDoctor, getDoctorById, updateDoctor } from "@/services/doctor.services"
import { type ApiErrorResponse, type ApiResponse } from "@/types/api.types"
import { type ICreateDoctorPayload, type IDoctor, type IDoctorDetails, type IUpdateDoctorPayload } from "@/types/doctor.types"
import { createDoctorServerZodSchema, updateDoctorServerZodSchema } from "@/zod/doctor.validation"

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

export const createDoctorAction = async (
  payload: ICreateDoctorPayload,
): Promise<ApiResponse<IDoctor> | ApiErrorResponse> => {
  const parsedPayload = createDoctorServerZodSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return {
      success: false,
      message: parsedPayload.error.issues[0]?.message || "Invalid input",
    }
  }

  try {
    return await createDoctor(parsedPayload.data)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to create doctor"),
    }
  }
}

export const updateDoctorAction = async (
  id: string,
  payload: IUpdateDoctorPayload,
): Promise<ApiResponse<IDoctor> | ApiErrorResponse> => {
  const parsedPayload = updateDoctorServerZodSchema.safeParse(payload)

  if (!parsedPayload.success) {
    return {
      success: false,
      message: parsedPayload.error.issues[0]?.message || "Invalid input",
    }
  }

  try {
    return await updateDoctor(id, parsedPayload.data)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to update doctor"),
    }
  }
}

export const deleteDoctorAction = async (
  id: string,
): Promise<ApiResponse<{ message: string }> | ApiErrorResponse> => {
  if (!id) {
    return {
      success: false,
      message: "Invalid doctor id",
    }
  }

  try {
    return await deleteDoctor(id)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to delete doctor"),
    }
  }
}

export const getDoctorByIdAction = async (
  id: string,
): Promise<ApiResponse<IDoctorDetails> | ApiErrorResponse> => {
  if (!id) {
    return {
      success: false,
      message: "Invalid doctor id",
    }
  }

  try {
    return await getDoctorById(id)
  } catch (error: unknown) {
    return {
      success: false,
      message: getActionErrorMessage(error, "Failed to fetch doctor details"),
    }
  }
}