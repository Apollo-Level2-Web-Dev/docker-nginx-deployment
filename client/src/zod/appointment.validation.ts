import { type IBookAppointmentPayload } from "@/types/appointment.types"
import { z } from "zod"

export const bookAppointmentServerZodSchema = z.object({
  doctorId: z.uuid("Doctor id must be a valid UUID"),
  scheduleId: z.uuid("Schedule id must be a valid UUID"),
}) satisfies z.ZodType<IBookAppointmentPayload>