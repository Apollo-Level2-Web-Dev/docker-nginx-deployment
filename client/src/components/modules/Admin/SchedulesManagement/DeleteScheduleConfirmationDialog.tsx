"use client"

import { deleteScheduleAction } from "@/app/(dashboardLayout)/admin/dashboard/schedules-management/_action"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type ISchedule } from "@/types/schedule.types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteScheduleConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: ISchedule | null
}

const formatScheduleLabel = (schedule: ISchedule | null) => {
  if (!schedule) {
    return "this schedule"
  }

  const startDateTime = new Date(schedule.startDateTime)
  if (Number.isNaN(startDateTime.getTime())) {
    return "this schedule"
  }

  return `schedule starting ${format(startDateTime, "MMM dd, yyyy hh:mm a")}`
}

const DeleteScheduleConfirmationDialog = ({
  open,
  onOpenChange,
  schedule,
}: DeleteScheduleConfirmationDialogProps) => {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: deleteScheduleAction,
  })

  const handleConfirmDelete = async () => {
    if (!schedule) {
      toast.error("Schedule not found")
      return
    }

    const result = await mutateAsync(schedule.id)

    if (!result.success) {
      toast.error(result.message || "Failed to delete schedule")
      return
    }

    toast.success(result.message || "Schedule deleted successfully")
    onOpenChange(false)

    void queryClient.invalidateQueries({ queryKey: ["schedules"] })
    void queryClient.refetchQueries({ queryKey: ["schedules"], type: "active" })
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {formatScheduleLabel(schedule)}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault()
              void handleConfirmDelete()
            }}
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteScheduleConfirmationDialog
