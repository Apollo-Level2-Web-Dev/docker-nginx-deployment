"use client"

import { createMyDoctorScheduleAction } from "@/app/(dashboardLayout)/doctor/dashboard/my-schedules/_action"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { getMyDoctorSchedules } from "@/services/doctorSchedule.services"
import { getSchedules } from "@/services/schedule.services"
import { type IDoctorSchedule } from "@/types/doctorSchedule.types"
import { type ISchedule } from "@/types/schedule.types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

const getTodayStartIsoString = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString()
}

const formatDateTime = (value: string | Date) => {
  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) {
    return "Invalid date"
  }

  return format(dateValue, "MMM dd, yyyy hh:mm a")
}

const BookScheduleModal = () => {
  const [open, setOpen] = useState(false)
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])

  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createMyDoctorScheduleAction,
  })

  const futureSchedulesQueryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", "1")
    params.set("limit", "500")
    params.set("sortBy", "startDateTime")
    params.set("sortOrder", "asc")
    params.set("startDateTime[gte]", getTodayStartIsoString())
    return params.toString()
  }, [])

  const { data: schedulesResponse, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ["bookable-schedules", futureSchedulesQueryString],
    queryFn: () => getSchedules(futureSchedulesQueryString),
    enabled: open,
    staleTime: 1000 * 60,
  })

  const { data: mySchedulesResponse, isLoading: isLoadingMySchedules } = useQuery({
    queryKey: ["my-doctor-schedules", "book-modal"] as const,
    queryFn: () => getMyDoctorSchedules("page=1&limit=1000"),
    enabled: open,
    staleTime: 1000 * 30,
  })

  const availableSchedules = useMemo<ISchedule[]>(() => {
    const now = new Date()
    const allFutureSchedules = (schedulesResponse?.data ?? []).filter((item) => {
      const startDateTime = new Date(item.startDateTime)
      return !Number.isNaN(startDateTime.getTime()) && startDateTime >= now
    })

    const existingScheduleIds = new Set(
      (mySchedulesResponse?.data ?? []).map((item: IDoctorSchedule) => item.scheduleId),
    )

    return allFutureSchedules.filter((item) => !existingScheduleIds.has(item.id))
  }, [mySchedulesResponse?.data, schedulesResponse?.data])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setSelectedScheduleIds([])
    }
  }

  const toggleScheduleSelection = (scheduleId: string, checked: boolean) => {
    setSelectedScheduleIds((prev) => {
      if (checked) {
        if (prev.includes(scheduleId)) {
          return prev
        }

        return [...prev, scheduleId]
      }

      return prev.filter((id) => id !== scheduleId)
    })
  }

  const handleBookSchedules = async () => {
    if (selectedScheduleIds.length === 0) {
      toast.error("Please select at least one schedule")
      return
    }

    const result = await mutateAsync({ scheduleIds: selectedScheduleIds })

    if (!result.success) {
      toast.error(result.message || "Failed to book schedules")
      return
    }

    toast.success(result.message || "Schedules booked successfully")
    setOpen(false)
    setSelectedScheduleIds([])

    void queryClient.invalidateQueries({ queryKey: ["my-doctor-schedules"] })
    void queryClient.refetchQueries({ queryKey: ["my-doctor-schedules"], type: "active" })
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" className="ml-auto shrink-0">
          <CalendarPlus className="size-4" />
          Book Schedule
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:w-[calc(100vw-4rem)] md:max-w-[calc(100vw-4rem)] lg:w-[min(88vw,56rem)] lg:max-w-[min(88vw,56rem)]"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Book Schedules</DialogTitle>
          <DialogDescription>
            Select available schedule slots from today onwards.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-5.5rem)]">
          <div className="space-y-4 px-6 py-5">
            {(isLoadingSchedules || isLoadingMySchedules) && (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                Loading available schedules...
              </div>
            )}

            {!isLoadingSchedules && !isLoadingMySchedules && availableSchedules.length === 0 && (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                No available schedule slots from today onward.
              </div>
            )}

            {!isLoadingSchedules && !isLoadingMySchedules && availableSchedules.length > 0 && (
              <div className="space-y-2">
                {availableSchedules.map((schedule) => {
                  const checked = selectedScheduleIds.includes(schedule.id)
                  return (
                    <label
                      key={schedule.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => toggleScheduleSelection(schedule.id, Boolean(value))}
                      />
                      <div className="space-y-1">
                        <p className="font-medium">
                          {formatDateTime(schedule.startDateTime)}
                        </p>
                        <p className="text-muted-foreground">
                          Ends at {formatDateTime(schedule.endDateTime)}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                onClick={() => void handleBookSchedules()}
                disabled={isPending || selectedScheduleIds.length === 0}
              >
                {isPending ? "Booking..." : `Book Selected (${selectedScheduleIds.length})`}
              </Button>
            </DialogFooter>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default BookScheduleModal
