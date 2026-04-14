"use client"

import { getScheduleByIdAction } from "@/app/(dashboardLayout)/admin/dashboard/schedules-management/_action"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type ISchedule } from "@/types/schedule.types"
import { useQuery } from "@tanstack/react-query"
import { differenceInMinutes, format } from "date-fns"

interface ViewScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: ISchedule | null
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return "N/A"
  }

  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) {
    return "N/A"
  }

  return format(dateValue, "MMM dd, yyyy hh:mm a")
}

const getDurationLabel = (startDateTime?: string | Date, endDateTime?: string | Date) => {
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

const ViewScheduleDialog = ({
  open,
  onOpenChange,
  schedule,
}: ViewScheduleDialogProps) => {
  const scheduleId = schedule?.id ?? ""

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["schedule-details", scheduleId],
    queryFn: () => getScheduleByIdAction(scheduleId),
    enabled: open && scheduleId.length > 0,
    staleTime: 1000 * 60,
  })

  const hasError = data && !data.success
  const scheduleDetails = data && data.success
    ? {
        ...schedule,
        ...data.data,
        appointments: data.data.appointments ?? schedule?.appointments,
        doctorSchedules: data.data.doctorSchedules ?? schedule?.doctorSchedules,
      }
    : schedule

  const bookedCount = scheduleDetails?.doctorSchedules?.filter((item) => item.isBooked).length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Schedule Details</DialogTitle>
          <DialogDescription>
            Review schedule timing, doctor assignments, and linked appointments.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-5.5rem)]">
          <div className="space-y-4 px-6 py-5">
            {(isLoading || isFetching) && (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                Loading schedule details...
              </div>
            )}

            {hasError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {data.message || "Failed to load schedule details."}
              </div>
            )}

            {!isLoading && !isFetching && scheduleDetails && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">Timing</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Schedule ID:</span> {scheduleDetails.id}</p>
                      <p><span className="font-medium">Start:</span> {formatDateTime(scheduleDetails.startDateTime)}</p>
                      <p><span className="font-medium">End:</span> {formatDateTime(scheduleDetails.endDateTime)}</p>
                      <p><span className="font-medium">Duration:</span> {getDurationLabel(scheduleDetails.startDateTime, scheduleDetails.endDateTime)}</p>
                      <p><span className="font-medium">Created:</span> {formatDateTime(scheduleDetails.createdAt)}</p>
                      <p><span className="font-medium">Updated:</span> {formatDateTime(scheduleDetails.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">Summary</h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {(scheduleDetails.doctorSchedules?.length ?? 0)} doctor slots
                      </Badge>
                      <Badge variant="secondary">{bookedCount} booked</Badge>
                      <Badge variant="secondary">
                        {(scheduleDetails.appointments?.length ?? 0)} appointments
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">Doctor Assignments</h3>
                    <div className="space-y-2">
                      {(scheduleDetails.doctorSchedules ?? []).slice(0, 10).map((item, index) => (
                        <div key={`${item.doctorId}-${index}`} className="rounded-md border p-2 text-sm">
                          <p><span className="font-medium">Doctor ID:</span> {item.doctorId}</p>
                          <p><span className="font-medium">Booked:</span> {item.isBooked ? "Yes" : "No"}</p>
                        </div>
                      ))}
                      {!scheduleDetails.doctorSchedules?.length && (
                        <p className="text-sm text-muted-foreground">No doctor assignments available.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">Appointments</h3>
                    <div className="space-y-2">
                      {(scheduleDetails.appointments ?? []).slice(0, 10).map((item, index) => (
                        <div key={item.id ?? `appointment-${index}`} className="rounded-md border p-2 text-sm">
                          <p><span className="font-medium">Appointment ID:</span> {item.id ?? "N/A"}</p>
                          <p><span className="font-medium">Status:</span> {item.status ?? "N/A"}</p>
                          <p><span className="font-medium">Doctor:</span> {item.doctor?.name ?? item.doctor?.email ?? "N/A"}</p>
                          <p><span className="font-medium">Patient:</span> {item.patient?.name ?? item.patient?.email ?? "N/A"}</p>
                        </div>
                      ))}
                      {!scheduleDetails.appointments?.length && (
                        <p className="text-sm text-muted-foreground">No appointments available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default ViewScheduleDialog
