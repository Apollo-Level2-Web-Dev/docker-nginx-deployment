import {
    type ICreateDoctorSchedulePayload,
    type IUpdateDoctorSchedulePayload,
} from "@/types/doctorSchedule.types"
import { z } from "zod"

export const createDoctorScheduleServerZodSchema = z.object({
  scheduleIds: z.array(z.uuid("Schedule id must be a valid UUID")).min(1, "Select at least one schedule"),
}) satisfies z.ZodType<ICreateDoctorSchedulePayload>

export const updateDoctorScheduleServerZodSchema = z.object({
  scheduleIds: z
    .array(
      z.object({
        shouldDelete: z.boolean(),
        id: z.uuid("Schedule id must be a valid UUID"),
      }),
    )
    .min(1, "Provide at least one schedule change"),
}) satisfies z.ZodType<IUpdateDoctorSchedulePayload>
