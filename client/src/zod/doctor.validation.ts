import { Gender, type ICreateDoctorPayload, type IUpdateDoctorPayload } from "@/types/doctor.types"
import { z } from "zod"

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined
  }

  return value
}

export const createDoctorFormZodSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(20, "Password must be at most 20 characters"),
  name: z
    .string()
    .trim()
    .min(5, "Name must be at least 5 characters")
    .max(30, "Name must be at most 30 characters"),
  email: z.email("Invalid email address"),
  contactNumber: z
    .string()
    .trim()
    .min(11, "Contact number must be at least 11 characters")
    .max(14, "Contact number must be at most 14 characters"),
  address: z
    .string()
    .trim()
    .max(100, "Address must be at most 100 characters")
    .refine(
      (value) => value.length === 0 || value.length >= 10,
      "Address must be at least 10 characters",
    ),
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required"),
  experience: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || /^\d+$/.test(value),
      "Experience must be an integer",
    ),
  gender: z.enum([Gender.MALE, Gender.FEMALE], {
    message: "Gender must be either MALE or FEMALE",
  }),
  appointmentFee: z
    .string()
    .trim()
    .min(1, "Appointment fee is required")
    .refine((value) => !Number.isNaN(Number(value)), "Appointment fee must be a number")
    .refine((value) => Number(value) >= 0, "Appointment fee cannot be negative"),
  qualification: z
    .string()
    .trim()
    .min(2, "Qualification must be at least 2 characters")
    .max(50, "Qualification must be at most 50 characters"),
  currentWorkingPlace: z
    .string()
    .trim()
    .min(2, "Current working place must be at least 2 characters")
    .max(50, "Current working place must be at most 50 characters"),
  designation: z
    .string()
    .trim()
    .min(2, "Designation must be at least 2 characters")
    .max(50, "Designation must be at most 50 characters"),
  specialties: z
    .array(z.uuid("Please select a valid specialty"))
    .min(1, "At least one specialty is required"),
})

export const createDoctorServerZodSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(20, "Password must be at most 20 characters"),
  doctor: z.object({
    name: z
      .string()
      .trim()
      .min(5, "Name must be at least 5 characters")
      .max(30, "Name must be at most 30 characters"),
    email: z.email("Invalid email address"),
    contactNumber: z
      .string()
      .trim()
      .min(11, "Contact number must be at least 11 characters")
      .max(14, "Contact number must be at most 14 characters"),
    address: z.preprocess(
      emptyStringToUndefined,
      z
        .string()
        .trim()
        .min(10, "Address must be at least 10 characters")
        .max(100, "Address must be at most 100 characters")
        .optional(),
    ),
    registrationNumber: z
      .string()
      .trim()
      .min(1, "Registration number is required"),
    experience: z.preprocess(
      emptyStringToUndefined,
      z
        .coerce
        .number({ error: "Experience must be an integer" })
        .int("Experience must be an integer")
        .nonnegative("Experience cannot be negative")
        .optional(),
    ),
    gender: z.enum([Gender.MALE, Gender.FEMALE], {
      message: "Gender must be either MALE or FEMALE",
    }),
    appointmentFee: z
      .coerce
      .number({ error: "Appointment fee must be a number" })
      .nonnegative("Appointment fee cannot be negative"),
    qualification: z
      .string()
      .trim()
      .min(2, "Qualification must be at least 2 characters")
      .max(50, "Qualification must be at most 50 characters"),
    currentWorkingPlace: z
      .string()
      .trim()
      .min(2, "Current working place must be at least 2 characters")
      .max(50, "Current working place must be at most 50 characters"),
    designation: z
      .string()
      .trim()
      .min(2, "Designation must be at least 2 characters")
      .max(50, "Designation must be at most 50 characters"),
  }),
  specialties: z
    .array(z.uuid("Please select a valid specialty"))
    .min(1, "At least one specialty is required"),
}) satisfies z.ZodType<ICreateDoctorPayload>

export const editDoctorFormZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, "Name must be at least 5 characters")
    .max(30, "Name must be at most 30 characters"),
  contactNumber: z
    .string()
    .trim()
    .min(11, "Contact number must be at least 11 characters")
    .max(14, "Contact number must be at most 14 characters"),
  address: z
    .string()
    .trim()
    .max(100, "Address must be at most 100 characters")
    .refine(
      (value) => value.length === 0 || value.length >= 10,
      "Address must be at least 10 characters",
    ),
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required"),
  experience: z
    .string()
    .trim()
    .refine(
      (value) => value.length === 0 || /^\d+$/.test(value),
      "Experience must be an integer",
    ),
  gender: z.enum([Gender.MALE, Gender.FEMALE], {
    message: "Gender must be either MALE or FEMALE",
  }),
  appointmentFee: z
    .string()
    .trim()
    .min(1, "Appointment fee is required")
    .refine((value) => !Number.isNaN(Number(value)), "Appointment fee must be a number")
    .refine((value) => Number(value) >= 0, "Appointment fee cannot be negative"),
  qualification: z
    .string()
    .trim()
    .min(2, "Qualification must be at least 2 characters")
    .max(50, "Qualification must be at most 50 characters"),
  currentWorkingPlace: z
    .string()
    .trim()
    .min(2, "Current working place must be at least 2 characters")
    .max(50, "Current working place must be at most 50 characters"),
  designation: z
    .string()
    .trim()
    .min(2, "Designation must be at least 2 characters")
    .max(50, "Designation must be at most 50 characters"),
  specialties: z
    .array(z.uuid("Please select a valid specialty"))
    .min(1, "At least one specialty is required"),
})

export const updateDoctorServerZodSchema = z.object({
  doctor: z
    .object({
      name: z
        .string()
        .trim()
        .min(5, "Name must be at least 5 characters")
        .max(30, "Name must be at most 30 characters")
        .optional(),
      contactNumber: z
        .string()
        .trim()
        .min(11, "Contact number must be at least 11 characters")
        .max(14, "Contact number must be at most 14 characters")
        .optional(),
      address: z.preprocess(
        emptyStringToUndefined,
        z
          .string()
          .trim()
          .min(10, "Address must be at least 10 characters")
          .max(100, "Address must be at most 100 characters")
          .optional(),
      ),
      registrationNumber: z
        .string()
        .trim()
        .min(1, "Registration number is required")
        .optional(),
      experience: z.preprocess(
        emptyStringToUndefined,
        z
          .coerce
          .number({ error: "Experience must be an integer" })
          .int("Experience must be an integer")
          .nonnegative("Experience cannot be negative")
          .optional(),
      ),
      gender: z
        .enum([Gender.MALE, Gender.FEMALE], {
          message: "Gender must be either MALE or FEMALE",
        })
        .optional(),
      appointmentFee: z.preprocess(
        emptyStringToUndefined,
        z
          .coerce
          .number({ error: "Appointment fee must be a number" })
          .nonnegative("Appointment fee cannot be negative")
          .optional(),
      ),
      qualification: z
        .string()
        .trim()
        .min(2, "Qualification must be at least 2 characters")
        .max(50, "Qualification must be at most 50 characters")
        .optional(),
      currentWorkingPlace: z
        .string()
        .trim()
        .min(2, "Current working place must be at least 2 characters")
        .max(50, "Current working place must be at most 50 characters")
        .optional(),
      designation: z
        .string()
        .trim()
        .min(2, "Designation must be at least 2 characters")
        .max(50, "Designation must be at most 50 characters")
        .optional(),
    })
    .optional(),
  specialties: z
    .array(
      z.object({
        specialtyId: z.uuid("Specialty ID must be a valid UUID"),
        shouldDelete: z.boolean("shouldDelete must be a boolean").optional(),
      }),
    )
    .optional(),
}) satisfies z.ZodType<IUpdateDoctorPayload>

export type ICreateDoctorFormValues = z.infer<typeof createDoctorFormZodSchema>
export type IEditDoctorFormValues = z.infer<typeof editDoctorFormZodSchema>