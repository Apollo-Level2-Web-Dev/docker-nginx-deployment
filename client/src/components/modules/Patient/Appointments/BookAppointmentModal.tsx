"use client"

import { getDoctorById } from "@/services/doctor.services"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { type IDoctorDetails, type IDoctorScheduleItem } from "@/types/doctor.types"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarPlus, Clock3, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

interface BookAppointmentModalProps {
  doctorId: string
  doctorName?: string
  isAuthenticated: boolean
  viewerRole?: string | null
  triggerClassName?: string
  fullWidth?: boolean
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return "N/A"
  }

  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) {
    return "N/A"
  }

  return format(dateValue, "EEE, MMM dd • hh:mm a")
}

const BookAppointmentModal = ({
  doctorId,
  doctorName,
  isAuthenticated,
  viewerRole,
  triggerClassName,
  fullWidth = false,
}: BookAppointmentModalProps) => {
  const [open, setOpen] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("")

  const router = useRouter()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["consultation-booking-doctor", doctorId],
    queryFn: () => getDoctorById(doctorId),
    enabled: open,
    staleTime: 1000 * 30,
  })

  const availableSchedules = useMemo<IDoctorScheduleItem[]>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (data?.data.doctorSchedules ?? [])
      .filter((item) => {
        if (item.isBooked || !item.schedule?.id || !item.schedule.startDateTime) {
          return false
        }

        const scheduleStart = new Date(item.schedule.startDateTime)
        if (Number.isNaN(scheduleStart.getTime())) {
          return false
        }

        return scheduleStart >= today
      })
      .sort((left, right) => {
        const leftValue = new Date(left.schedule?.startDateTime ?? 0).getTime()
        const rightValue = new Date(right.schedule?.startDateTime ?? 0).getTime()
        return leftValue - rightValue
      })
  }, [data?.data.doctorSchedules])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setSelectedScheduleId("")
    }
  }

  const handleProceed = () => {
    if (!selectedScheduleId) {
      toast.error("Select a schedule slot first")
      return
    }

    const targetPath = `/dashboard/book-appointments?doctorId=${encodeURIComponent(doctorId)}&scheduleId=${encodeURIComponent(selectedScheduleId)}`

    if (!isAuthenticated) {
      setOpen(false)
      router.push(`/login?redirect=${encodeURIComponent(targetPath)}`)
      return
    }

    if (viewerRole && viewerRole !== "PATIENT") {
      toast.error("Only patient accounts can book appointments")
      return
    }

    setOpen(false)
    router.push(targetPath)
  }

  const isBusy = isLoading || isFetching

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className={triggerClassName} variant="outline">
          <CalendarPlus className="size-4" />
          Book Appointment
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Choose one available slot for {doctorName || data?.data.name || "this doctor"} from today onward.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-10rem)]">
          <div className="space-y-4 px-6 py-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Upcoming only</Badge>
              <Badge variant="secondary">One slot per booking</Badge>
              {!isAuthenticated && <Badge variant="outline">Login required to continue</Badge>}
            </div>

            {isBusy && (
              <div className="flex items-center gap-2 rounded-xl border p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading available schedules...
              </div>
            )}

            {!isBusy && availableSchedules.length === 0 && (
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                No available schedules from today onward.
              </div>
            )}

            {!isBusy && availableSchedules.length > 0 && (
              <div className="grid gap-3">
                {availableSchedules.map((item) => {
                  const scheduleId = item.schedule?.id ?? ""
                  const isSelected = selectedScheduleId === scheduleId

                  return (
                    <button
                      key={scheduleId}
                      type="button"
                      onClick={() => setSelectedScheduleId(scheduleId)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "bg-card hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium">{formatDateTime(item.schedule?.startDateTime)}</p>
                          <p className="text-sm text-muted-foreground">
                            Ends {formatDateTime(item.schedule?.endDateTime)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock3 className="size-3.5" />
                          <span>{isSelected ? "Selected" : "Tap to select"}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleProceed} className={fullWidth ? "w-full sm:w-auto" : undefined}>
            {isAuthenticated ? "Proceed to Confirm" : "Login to Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default BookAppointmentModal