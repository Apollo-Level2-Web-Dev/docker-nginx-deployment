"use client"

import { createScheduleAction } from "@/app/(dashboardLayout)/admin/dashboard/schedules-management/_action"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    createScheduleFormZodSchema,
    type ICreateScheduleFormValues,
} from "@/zod/schedule.validation"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { toast } from "sonner"

const defaultValues: ICreateScheduleFormValues = {
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
}

const CreateScheduleFormModal = () => {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createScheduleAction,
  })

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value)

      if (!result.success) {
        toast.error(result.message || "Failed to create schedules")
        return
      }

      const createdCount = result.data?.length ?? 0
      toast.success(
        result.message ||
          (createdCount > 0
            ? `${createdCount} schedules created successfully`
            : "Schedules created successfully"),
      )
      setOpen(false)
      form.reset()

      void queryClient.invalidateQueries({ queryKey: ["schedules"] })
      void queryClient.refetchQueries({ queryKey: ["schedules"], type: "active" })
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
          Create Schedule
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:w-[calc(100vw-4rem)] md:max-w-[calc(100vw-4rem)] lg:w-[min(88vw,44rem)] lg:max-w-[min(88vw,44rem)]"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Create Schedule</DialogTitle>
          <DialogDescription>
            Generate 30-minute schedule slots across a date range.
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
                  validators={{ onChange: createScheduleFormZodSchema.shape.startDate }}
                >
                  {(field) => (
                    <AppField field={field} label="Start Date" type="date" />
                  )}
                </form.Field>

                <form.Field
                  name="endDate"
                  validators={{ onChange: createScheduleFormZodSchema.shape.endDate }}
                >
                  {(field) => (
                    <AppField field={field} label="End Date" type="date" />
                  )}
                </form.Field>

                <form.Field
                  name="startTime"
                  validators={{ onChange: createScheduleFormZodSchema.shape.startTime }}
                >
                  {(field) => (
                    <AppField field={field} label="Start Time" type="time" />
                  )}
                </form.Field>

                <form.Field
                  name="endTime"
                  validators={{ onChange: createScheduleFormZodSchema.shape.endTime }}
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
                <AppSubmitButton isPending={isPending} pendingLabel="Creating..." className="w-auto">
                  Create Schedule
                </AppSubmitButton>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default CreateScheduleFormModal
