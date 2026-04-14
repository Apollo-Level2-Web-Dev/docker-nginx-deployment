import { Badge } from "@/components/ui/badge";
import { UserStatus } from "@/types/doctor.types";

interface IStatusBadgeCellProps {
    status : UserStatus;
}

const StatusBadgeCell = ({ status }: IStatusBadgeCellProps) => {
  return (
    <Badge
    
        variant={status === UserStatus.ACTIVE ? "default" : status === UserStatus.BLOCKED ? "destructive" : "secondary"}
        // className="px-2 py-1"
    >
        <span className="text-sm capitalize">{status.toLowerCase()}</span>
    </Badge>
  )
}

export default StatusBadgeCell