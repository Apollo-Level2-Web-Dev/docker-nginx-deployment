"use client"

import { updateScheduleAction } from "@/app/(dashboardLayout)/admin/dashboard/schedules-management/_action"
import AppField from "@/components/shared/form/AppField"
import AppSubmitButton from "@/components/shared/form/AppSubmitButton"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type ISchedule } from "@/types/schedule.types"
import {
    editScheduleFormZodSchema,
    type IEditScheduleFormValues,
} from "@/zod/schedule.validation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

interface EditScheduleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: ISchedule | null
}

const getFormattedInputValue = (value: string | Date | undefined, formatString: string) => {
  if (!value) {
    return ""
  }

  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) {
    return ""
  }

  return format(dateValue, formatString)
}

const getInitialValues = (schedule: ISchedule | null): IEditScheduleFormValues => ({
  startDate: getFormattedInputValue(schedule?.startDateTime, "yyyy-MM-dd"),
  endDate: getFormattedInputValue(schedule?.endDateTime, "yyyy-MM-dd"),
  startTime: getFormattedInputValue(schedule?.startDateTime, "HH:mm"),
  endTime: getFormattedInputValue(schedule?.endDateTime, "HH:mm"),
})

const EditScheduleFormModal = ({
  open,
  onOpenChange,
  schedule,
}: EditScheduleFormModalProps) => {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ scheduleId, payload }: { scheduleId: string; payload: IEditScheduleFormValues }) =>
      updateScheduleAction(scheduleId, payload),
  })

  const form = useForm({
    defaultValues: getInitialValues(schedule),
    onSubmit: async ({ value }) => {
      if (!schedule) {
        toast.error("Schedule not found")
        return
      }

      const result = await mutateAsync({
        scheduleId: schedule.id,
        payload: value,
      })

      if (!result.success) {
        toast.error(result.message || "Failed to update schedule")
        return
      }

      toast.success(result.message || "Schedule updated successfully")
      onOpenChange(false)

      void queryClient.invalidateQueries({ queryKey: ["schedules"] })
      void queryClient.refetchQueries({ queryKey: ["schedules"], type: "active" })
      router.refresh()
    },
  })

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues(schedule))
    }
  }, [form, open, schedule])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:w-[calc(100vw-4rem)] md:max-w-[calc(100vw-4rem)] lg:w-[min(88vw,44rem)] lg:max-w-[min(88vw,44rem)]"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Edit Schedule</DialogTitle>
          <DialogDescription>
            Update the date and time range for this schedule slot.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="startDate"
                  validators={{ onChange: editScheduleFormZodSchema.shape.startDate }}
                >
                  {(field) => (
                    <AppField field={field} label="Start Date" type="date" />
                  )}
                </form.Field>

                <form.Field
                  name="endDate"
                  validators={{ onChange: editScheduleFormZodSchema.shape.endDate }}
                >
                  {(field) => (
                    <AppField field={field} label="End Date" type="date" />
                  )}
                </form.Field>

                <form.Field
                  name="startTime"
                  validators={{ onChange: editScheduleFormZodSchema.shape.startTime }}
                >
                  {(field) => (
                    <AppField field={field} label="Start Time" type="time" />
                  )}
                </form.Field>

                <form.Field
                  name="endTime"
                  validators={{ onChange: editScheduleFormZodSchema.shape.endTime }}
                >
                  {(field) => (
                    <AppField field={field} label="End Time" type="time" />
                  )}
                </form.Field>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    Cancel
                  </Button>
                </DialogClose>
                <AppSubmitButton isPending={isPending} pendingLabel="Updating..." className="w-auto">
                  Save Changes
                </AppSubmitButton>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default EditScheduleFormModal
