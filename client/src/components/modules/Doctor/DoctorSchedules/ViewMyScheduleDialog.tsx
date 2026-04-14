"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { type IDoctorSchedule } from "@/types/doctorSchedule.types"
import { differenceInMinutes, format } from "date-fns"

interface ViewMyScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctorSchedule: IDoctorSchedule | null
}

const formatDateTime = (value?: string | Date) => {
  if (!value) {
    return "N/A"
  }

  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) {
    return "N/A"
  }

  return format(dateValue, "MMM dd, yyyy hh:mm a")
}

const getDurationLabel = (doctorSchedule: IDoctorSchedule | null) => {
  const startDateTime = doctorSchedule?.schedule?.startDateTime
  const endDateTime = doctorSchedule?.schedule?.endDateTime

  if (!startDateTime || !endDateTime) {
    return "N/A"
  }

  const startDate = new Date(startDateTime)
  const endDate = new Date(endDateTime)

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "N/A"
  }

  const durationInMinutes = differenceInMinutes(endDate, startDate)
  return durationInMinutes > 0 ? `${durationInMinutes} mins` : "N/A"
}

const ViewMyScheduleDialog = ({
  open,
  onOpenChange,
  doctorSchedule,
}: ViewMyScheduleDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>My Schedule Details</DialogTitle>
          <DialogDescription>
            Review your assigned schedule slot information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-6 py-5 text-sm">
          <p><span className="font-medium">Schedule ID:</span> {doctorSchedule?.scheduleId ?? "N/A"}</p>
          <p><span className="font-medium">Start:</span> {formatDateTime(doctorSchedule?.schedule?.startDateTime)}</p>
          <p><span className="font-medium">End:</span> {formatDateTime(doctorSchedule?.schedule?.endDateTime)}</p>
          <p><span className="font-medium">Duration:</span> {getDurationLabel(doctorSchedule)}</p>
          <p><span className="font-medium">Booked by Patient:</span> {doctorSchedule?.isBooked ? "Yes" : "No"}</p>
          <p><span className="font-medium">Assigned On:</span> {formatDateTime(doctorSchedule?.createdAt)}</p>
          <p><span className="font-medium">Updated On:</span> {formatDateTime(doctorSchedule?.updatedAt)}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ViewMyScheduleDialog
