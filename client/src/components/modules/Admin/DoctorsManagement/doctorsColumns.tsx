import DateCell from "@/components/shared/cell/DateCell";
import StatusBadgeCell from "@/components/shared/cell/StatusBadgeCell";
import UserInfoCell from "@/components/shared/cell/UserInfoCell";
import { Badge } from "@/components/ui/badge";
import { IDoctor } from "@/types/doctor.types";
import { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";

export const doctorColumns: ColumnDef<IDoctor>[] = [
  //id or accessorKey is same as the key in the data object
  {
    id: "name",
    accessorKey: "name",
    header: "Doctor",
    cell: ({ row }) => ( 
        <UserInfoCell
            name={row.original.name}
            email={row.original.email}
            profilePhoto={row.original.profilePhoto}
        />
    ),
  },
  {
    id: "specialties",
    accessorKey: "specialties",
    enableSorting: false,
    header: "Specialties",
    cell: ({ row }) => {
        const specialties = row.original.specialties

        if(!specialties || specialties.length === 0) {
            return (
                <span className="text-xs text-muted-foreground">No Specialties</span>
            )
        }


        return (
            <div>
                {
                specialties.map(({specialty}, id) => {
                    const title = specialty.title || "N/A";
                    return (
                        <Badge variant={"secondary"} key={id}>
                            {title}
                        </Badge>
                    )
                })
                }
            </div>
        )
    },
  },
  {
    id: "contactNumber",
    accessorKey: "contactNumber",
    header: "Contact Number",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{row.original?.contactNumber || "N/A"}</span>
      </div>
    ),
  },
  {
    id: "experience",
    accessorKey: "experience",
    header: "Experience",
    cell: ({ row }) => {
      return (
        <span className="text-sm font-medium">
          {row.original.experience ?? 0} years
        </span>
      );
    },
  },
  {
    id: "appointmentFee",
    accessorKey: "appointmentFee",
    header: "Fee",
    cell: ({ row }) => {
      return (
        <span className="text-sm font-semibold text-green-600">
          ${row.original?.appointmentFee.toFixed(2) ?? "N/A"}
        </span>
      );
    },
  },
  {
    id: "averageRating",
    accessorKey: "averageRating",
    header: "Rating",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-medium">
            {row.original.averageRating?.toFixed(1) || "0.0"}
          </span>
        </div>
      );
    },
  },
  {
    id: "gender",
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => {
      return (
        <span className="text-sm capitalize">
          {row.original.gender.toLowerCase()}
        </span>
      );
    },
  },
  {
    id: "status",
    accessorKey: "user.status",
    header: "Status",
    cell: ({ row }) => {
      return (
        <StatusBadgeCell status={row.original.user.status} />
      );
    },
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Joined On",
    cell: ({ row }) => {
      return (
        <DateCell date={row.original.createdAt} formatString="MMM dd, yyyy" />
      );
    },
  },
];
