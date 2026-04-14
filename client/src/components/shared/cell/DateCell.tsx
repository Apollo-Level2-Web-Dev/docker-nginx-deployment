import { format } from "date-fns";

interface DateCellProps{
    date : string | Date;
    formatString ?: string;
}


const DateCell = ({ date, formatString }: DateCellProps) => {

    if(!date) return <span className="text-sm text-muted-foreground">-</span>

    const formattedDate = format(new Date(date), formatString || "MMM dd, yyyy");
  return (
    <span className="text-sm">{formattedDate}</span>
  )
}

export default DateCell