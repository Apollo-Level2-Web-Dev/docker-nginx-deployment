import DateCell from "@/components/shared/cell/DateCell"
import { Badge } from "@/components/ui/badge"
import { type IDoctorSchedule } from "@/types/doctorSchedule.types"
import { ColumnDef } from "@tanstack/react-table"
import { differenceInMinutes } from "date-fns"

const getDurationLabel = (doctorSchedule: IDoctorSchedule) => {
  const startDateTime = doctorSchedule.schedule?.startDateTime
  const endDateTime = doctorSchedule.schedule?.endDateTime

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

export const doctorSchedulesColumns: ColumnDef<IDoctorSchedule>[] = [
  {
    id: "startDateTime",
    accessorKey: "schedule.startDateTime",
    header: "Start",
    cell: ({ row }) => {
      const startDateTime = row.original.schedule?.startDateTime

      if (!startDateTime) {
        return <span className="text-sm text-muted-foreground">N/A</span>
      }

      return <DateCell date={startDateTime} formatString="MMM dd, yyyy hh:mm a" />
    },
  },
  {
    id: "endDateTime",
    accessorKey: "schedule.endDateTime",
    header: "End",
    cell: ({ row }) => {
      const endDateTime = row.original.schedule?.endDateTime

      if (!endDateTime) {
        return <span className="text-sm text-muted-foreground">N/A</span>
      }

      return <DateCell date={endDateTime} formatString="MMM dd, yyyy hh:mm a" />
    },
  },
  {
    id: "duration",
    header: "Duration",
    enableSorting: false,
    cell: ({ row }) => <span className="text-sm font-medium">{getDurationLabel(row.original)}</span>,
  },
  {
    id: "isBooked",
    accessorKey: "isBooked",
    header: "Booked",
    cell: ({ row }) => {
      const isBooked = row.original.isBooked

      return (
        <Badge variant={isBooked ? "destructive" : "secondary"}>
          {isBooked ? "Booked" : "Available"}
        </Badge>
      )
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Assigned On",
    cell: ({ row }) => {
      if (!row.original.createdAt) {
        return <span className="text-sm text-muted-foreground">N/A</span>
      }

      return <DateCell date={row.original.createdAt} formatString="MMM dd, yyyy" />
    },
  },
]
