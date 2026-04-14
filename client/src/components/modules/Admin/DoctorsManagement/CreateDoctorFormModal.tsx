"use client"

import { createDoctorAction } from "@/app/(dashboardLayout)/admin/dashboard/doctors-management/_action"
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
    DialogTrigger,
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
import { Gender } from "@/types/doctor.types"
import { type ISpecialty } from "@/types/specialty.types"
import {
    createDoctorFormZodSchema,
    type ICreateDoctorFormValues,
} from "@/zod/doctor.validation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import SpecialtiesMultiSelect from "./SpecialtiesMultiSelect"

interface CreateDoctorFormModalProps {
  specialties: ISpecialty[]
  isLoadingSpecialties?: boolean
}

const defaultValues: ICreateDoctorFormValues = {
  password: "",
  name: "",
  email: "",
  contactNumber: "",
  address: "",
  registrationNumber: "",
  experience: "",
  gender: Gender.MALE,
  appointmentFee: "",
  qualification: "",
  currentWorkingPlace: "",
  designation: "",
  specialties: [],
}

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

const CreateDoctorFormModal = ({
  specialties,
  isLoadingSpecialties = false,
}: CreateDoctorFormModalProps) => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createDoctorAction,
  })

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const payload = {
        password: value.password,
        doctor: {
          name: value.name,
          email: value.email,
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
        specialties: value.specialties,
      } as const

      const result = await mutateAsync(payload)

      if (!result.success) {
        toast.error(result.message || "Failed to create doctor")
        return
      }

      toast.success(result.message || "Doctor created successfully")
      setOpen(false)
      form.reset()

      void queryClient.invalidateQueries({ queryKey: ["doctors"] })
      void queryClient.refetchQueries({ queryKey: ["doctors"], type: "active" })
      router.refresh()
    },
  })

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)

      if (!nextOpen) {
        form.reset()
      }
    },
    [form],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="ml-auto shrink-0">
          <Plus className="size-4" />
          Create Doctor
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:w-[calc(100vw-4rem)] md:max-w-[calc(100vw-4rem)] lg:w-[min(92vw,78rem)] lg:max-w-[min(92vw,78rem)] xl:w-[min(88vw,88rem)] xl:max-w-[min(88vw,88rem)] 2xl:w-[min(84vw,96rem)] 2xl:max-w-[min(84vw,96rem)]"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Create Doctor</DialogTitle>
          <DialogDescription>
            Add a new doctor profile with account credentials and specialties.
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.name }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Full Name"
                      placeholder="Enter doctor name"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="email"
                  validators={{ onChange: createDoctorFormZodSchema.shape.email }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Email"
                      type="email"
                      placeholder="doctor@example.com"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="password"
                  validators={{ onChange: createDoctorFormZodSchema.shape.password }}
                >
                  {(field) => (
                    <AppField
                      field={field}
                      label="Password"
                      type="password"
                      placeholder="Enter temporary password"
                    />
                  )}
                </form.Field>

                <form.Field
                  name="contactNumber"
                  validators={{ onChange: createDoctorFormZodSchema.shape.contactNumber }}
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.registrationNumber }}
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.experience }}
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.appointmentFee }}
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.qualification }}
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.currentWorkingPlace }}
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.designation }}
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.gender }}
                >
                  {(field) => {
                    const firstError =
                      field.state.meta.isTouched && field.state.meta.errors.length > 0
                        ? field.state.meta.errors[0]
                        : null

                    return (
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="doctor-gender"
                          className={cn(firstError && "text-destructive")}
                        >
                          Gender
                        </Label>
                        <Select
                          value={field.state.value}
                          onValueChange={(value) => {
                            field.handleChange(value as ICreateDoctorFormValues["gender"])
                            field.handleBlur()
                          }}
                        >
                          <SelectTrigger
                            id="doctor-gender"
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
                  validators={{ onChange: createDoctorFormZodSchema.shape.address }}
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
                validators={{ onChange: createDoctorFormZodSchema.shape.specialties }}
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
                      pendingLabel="Creating doctor..."
                      disabled={!canSubmit || isLoadingSpecialties}
                      className="w-auto min-w-36"
                    >
                      Create Doctor
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

export default CreateDoctorFormModal