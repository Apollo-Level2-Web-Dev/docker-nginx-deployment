import DateCell from "@/components/shared/cell/DateCell"
import { Badge } from "@/components/ui/badge"
import { type ISchedule } from "@/types/schedule.types"
import { ColumnDef } from "@tanstack/react-table"
import { differenceInMinutes } from "date-fns"

const getDurationLabel = (schedule: ISchedule) => {
  const startDateTime = new Date(schedule.startDateTime)
  const endDateTime = new Date(schedule.endDateTime)

  if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
    return "N/A"
  }

  const durationInMinutes = differenceInMinutes(endDateTime, startDateTime)
  if (durationInMinutes <= 0) {
    return "N/A"
  }

  return `${durationInMinutes} mins`
}

const getBookedCount = (schedule: ISchedule) => {
  return schedule.doctorSchedules?.filter((item) => item.isBooked).length ?? 0
}

export const schedulesColumns: ColumnDef<ISchedule>[] = [
  {
    id: "startDateTime",
    accessorKey: "startDateTime",
    header: "Start",
    cell: ({ row }) => (
      <DateCell date={row.original.startDateTime} formatString="MMM dd, yyyy hh:mm a" />
    ),
  },
  {
    id: "endDateTime",
    accessorKey: "endDateTime",
    header: "End",
    cell: ({ row }) => (
      <DateCell date={row.original.endDateTime} formatString="MMM dd, yyyy hh:mm a" />
    ),
  },
  {
    id: "duration",
    header: "Duration",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm font-medium">{getDurationLabel(row.original)}</span>
    ),
  },
  {
    id: "doctorSchedules",
    accessorKey: "doctorSchedules",
    header: "Doctor Slots",
    enableSorting: false,
    cell: ({ row }) => {
      const totalDoctorSchedules = row.original.doctorSchedules?.length ?? 0
      return <Badge variant="secondary">{totalDoctorSchedules} linked</Badge>
    },
  },
  {
    id: "bookedCount",
    header: "Booked",
    enableSorting: false,
    cell: ({ row }) => {
      return <span className="text-sm">{getBookedCount(row.original)}</span>
    },
  },
  {
    id: "appointments",
    accessorKey: "appointments",
    header: "Appointments",
    enableSorting: false,
    cell: ({ row }) => {
      const totalAppointments = row.original.appointments?.length ?? 0
      return <span className="text-sm">{totalAppointments}</span>
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      if (!row.original.createdAt) {
        return <span className="text-sm text-muted-foreground">N/A</span>
      }

      return <DateCell date={row.original.createdAt} formatString="MMM dd, yyyy" />
    },
  },
]
