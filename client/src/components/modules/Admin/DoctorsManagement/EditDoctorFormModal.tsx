"use client"

import { updateDoctorAction } from "@/app/(dashboardLayout)/admin/dashboard/doctors-management/_action"
import AppField from "@/components/shared/form/AppField"
import AppSubmitButton from "@/components/shared/form/AppSubmitButton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Gender, type IDoctor, type IUpdateDoctorPayload } from "@/types/doctor.types"
import { type ISpecialty } from "@/types/specialty.types"
import {
  editDoctorFormZodSchema,
  type IEditDoctorFormValues,
} from "@/zod/doctor.validation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"
import SpecialtiesMultiSelect from "./SpecialtiesMultiSelect"

interface EditDoctorFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctor: IDoctor | null
  specialties: ISpecialty[]
  isLoadingSpecialties?: boolean
}

const getInitialValues = (doctor: IDoctor | null): IEditDoctorFormValues => ({
  name: doctor?.name ?? "",
  contactNumber: doctor?.contactNumber ?? "",
  address: doctor?.address ?? "",
  registrationNumber: doctor?.registrationNumber ?? "",
  experience: doctor?.experience?.toString() ?? "",
  gender: doctor?.gender === Gender.FEMALE ? Gender.FEMALE : Gender.MALE,
  appointmentFee: doctor?.appointmentFee?.toString() ?? "",
  qualification: doctor?.qualification ?? "",
  currentWorkingPlace: doctor?.currentWorkingPlace ?? "",
  designation: doctor?.designation ?? "",
  specialties: doctor?.specialties?.map((item) => item.specialty.id) ?? [],
})

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }

  return "Invalid input"
}

const FieldMessage = ({ error }: { error: unknown }) => {
  if (!error) {
    return null
  }

  return <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
}

const EditDoctorFormModal = ({
  open,
  onOpenChange,
  doctor,
  specialties,
  isLoadingSpecialties = false,
}: EditDoctorFormModalProps) => {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ doctorId, payload }: { doctorId: string; payload: IUpdateDoctorPayload }) =>
      updateDoctorAction(doctorId, payload),
  })

  const form = useForm({
    defaultValues: getInitialValues(doctor),
    onSubmit: async ({ value }) => {
      if (!doctor) {
        toast.error("Doctor not found")
        return
      }

      const originalSpecialtyIds = new Set(
        doctor.specialties.map((item) => item.specialty.id),
      )
      const nextSpecialtyIds = new Set(value.specialties)

      const specialtyChanges: IUpdateDoctorPayload["specialties"] = []

      nextSpecialtyIds.forEach((specialtyId) => {
        if (!originalSpecialtyIds.has(specialtyId)) {
          specialtyChanges.push({ specialtyId, shouldDelete: false })
        }
      })

      originalSpecialtyIds.forEach((specialtyId) => {
        if (!nextSpecialtyIds.has(specialtyId)) {
          specialtyChanges.push({ specialtyId, shouldDelete: true })
        }
      })

      const payload: IUpdateDoctorPayload = {
        doctor: {
          name: value.name,
          contactNumber: value.contactNumber,
          address: value.address,
          registrationNumber: value.registrationNumber,
          experience: value.experience ? Number(value.experience) : undefined,
          gender: value.gender,
          appointmentFee: Number(value.appointmentFee),
          qualification: value.qualification,
          currentWorkingPlace: value.currentWorkingPlace,
          designation: value.designation,
        },
        ...(specialtyChanges.length > 0 ? { specialties: specialtyChanges } : {}),
      }

      const result = await mutateAsync({
        doctorId: String(doctor.id),
        payload,
      })

      if (!result.success) {
        toast.error(result.message || "Failed to update doctor")
        return
      }

      toast.success(result.message || "Doctor updated successfully")
      onOpenChange(false)

      void queryClient.invalidateQueries({ queryKey: ["doctors"] })
      void queryClient.refetchQueries({ queryKey: ["doctors"], type: "active" })
      router.refresh()
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues(doctor))
    }
  }, [doctor, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:w-[calc(100vw-4rem)] md:max-w-[calc(100vw-4rem)] lg:w-[min(92vw,78rem)] lg:max-w-[min(92vw,78rem)] xl:w-[min(88vw,88rem)] xl:max-w-[min(88vw,88rem)] 2xl:w-[min(84vw,96rem)] 2xl:max-w-[min(84vw,96rem)]"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Edit Doctor</DialogTitle>
          <DialogDescription>
            Update doctor profile information and specialties.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-5.5rem)]">
          <div className="px-6 py-5">
            <form
              method="POST"
              action="#"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field
                  name="name"
                  validators={{ onChange: editDoctorFormZodSchema.shape.name }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Full Name"
                      placeholder="Enter doctor name"
                    />
                  )}
                </form.Field>

                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <div className="bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm">
                    {doctor?.email ?? "N/A"}
                  </div>
                </div>

                <form.Field
                  name="contactNumber"
                  validators={{ onChange: editDoctorFormZodSchema.shape.contactNumber }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Contact Number"
                      placeholder="Enter contact number"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="registrationNumber"
                  validators={{ onChange: editDoctorFormZodSchema.shape.registrationNumber }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Registration Number"
                      placeholder="Enter registration number"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="experience"
                  validators={{ onChange: editDoctorFormZodSchema.shape.experience }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Experience"
                      type="number"
                      placeholder="Years of experience"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="appointmentFee"
                  validators={{ onChange: editDoctorFormZodSchema.shape.appointmentFee }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Appointment Fee"
                      type="number"
                      placeholder="Enter appointment fee"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="qualification"
                  validators={{ onChange: editDoctorFormZodSchema.shape.qualification }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Qualification"
                      placeholder="e.g. MBBS, FCPS"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="currentWorkingPlace"
                  validators={{ onChange: editDoctorFormZodSchema.shape.currentWorkingPlace }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Current Working Place"
                      placeholder="Enter current workplace"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="designation"
                  validators={{ onChange: editDoctorFormZodSchema.shape.designation }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Designation"
                      placeholder="Enter designation"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="gender"
                  validators={{ onChange: editDoctorFormZodSchema.shape.gender }}
                >
                  {(field) => {
                    const firstError =
                      field.state.meta.isTouched && field.state.meta.errors.length > 0
                        ? field.state.meta.errors[0]
                        : null

                    return (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="edit-doctor-gender"
                          className={cn(firstError && "text-destructive")}
                        >
                          Gender
                        </Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => {
                            field.handleChange(value as IEditDoctorFormValues["gender"])
                            field.handleBlur()
                          }}
                        >
                          <SelectTrigger
                            id="edit-doctor-gender"
                            className={cn("w-full", firstError && "border-destructive")}
                          >
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldMessage error={firstError} />
                      </div>
                    )
                  }}
                </form.Field>

                <form.Field
                  name="address"
                  validators={{ onChange: editDoctorFormZodSchema.shape.address }}
                >
                  {(field) => {
                    const firstError =
                      field.state.meta.isTouched && field.state.meta.errors.length > 0
                        ? field.state.meta.errors[0]
                        : null

                    return (
                      <div className="space-y-1.5 md:col-span-2">
                        <Label
                          htmlFor={field.name}
                          className={cn(firstError && "text-destructive")}
                        >
                          Address
                        </Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          placeholder="Enter doctor address"
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          aria-invalid={!!firstError}
                          className={cn(firstError && "border-destructive")}
                        />
                        <FieldMessage error={firstError} />
                      </div>
                    )
                  }}
                </form.Field>
              </div>

              <form.Field
                name="specialties"
                validators={{ onChange: editDoctorFormZodSchema.shape.specialties }}
              >
                {(field) => {
                  const firstError =
                    field.state.meta.isTouched && field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]
                      : null

                  return (
                    <SpecialtiesMultiSelect
                      specialties={specialties}
                      selectedSpecialtyIds={field.state.value}
                      onChange={field.handleChange}
                      onBlur={field.handleBlur}
                      isLoadingSpecialties={isLoadingSpecialties}
                      error={firstError}
                      getErrorMessage={getErrorMessage}
                    />
                  )
                }}
              </form.Field>

              <div className="flex items-center justify-end gap-3 border-t pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </DialogClose>

                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                >
                  {([canSubmit, isSubmitting]) => (
                    <AppSubmitButton
                      isPending={isSubmitting || isPending}
                      pendingLabel="Updating doctor..."
                      disabled={!canSubmit || isLoadingSpecialties}
                      className="w-auto min-w-36"
                    >
                      Update Doctor
                    </AppSubmitButton>
                  )}
                </form.Subscribe>
              </div>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default EditDoctorFormModal