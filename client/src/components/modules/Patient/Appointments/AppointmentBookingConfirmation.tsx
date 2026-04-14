"use client"

import {
  bookAppointmentAction,
  bookAppointmentWithPayLaterAction,
} from "@/app/_actions/appointment.actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useMutation } from "@tanstack/react-query"
import { format } from "date-fns"
import { AlertCircle, CreditCard, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AppointmentBookingConfirmationProps {
  doctorId: string
  scheduleId: string
  doctorName: string
  doctorDesignation?: string
  doctorProfilePhoto?: string
  doctorWorkingPlace?: string
  appointmentFee?: number
  scheduleStart?: string | Date
  scheduleEnd?: string | Date
  isScheduleAvailable: boolean
}

const formatDateTime = (value?: string | Date) => {
  if (!value) {
    return "N/A"
  }

  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) {
    return "N/A"
  }

  return format(dateValue, "EEEE, MMM dd, yyyy • hh:mm a")
}

const getInitials = (name: string) => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "DR"
}

const AppointmentBookingConfirmation = ({
  doctorId,
  scheduleId,
  doctorName,
  doctorDesignation,
  doctorProfilePhoto,
  doctorWorkingPlace,
  appointmentFee,
  scheduleStart,
  scheduleEnd,
  isScheduleAvailable,
}: AppointmentBookingConfirmationProps) => {
  const router = useRouter()

  const payNowMutation = useMutation({
    mutationFn: bookAppointmentAction,
  })

  const payLaterMutation = useMutation({
    mutationFn: bookAppointmentWithPayLaterAction,
  })

  const handlePayNow = async () => {
    const result = await payNowMutation.mutateAsync({ doctorId, scheduleId })

    if (!result.success) {
      toast.error(result.message || "Failed to book appointment")
      return
    }

    if (!result.data.paymentUrl) {
      toast.error("Payment link is unavailable right now")
      return
    }

    window.location.assign(result.data.paymentUrl)
  }

  const handlePayLater = async () => {
    const result = await payLaterMutation.mutateAsync({ doctorId, scheduleId })

    if (!result.success) {
      toast.error(result.message || "Failed to book appointment")
      return
    }

    router.push("/dashboard/my-appointments?status=pay_later_booked")
    router.refresh()
  }

  if (!isScheduleAvailable) {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Selected slot is no longer available</CardTitle>
          <CardDescription>
            This schedule may already be booked or may have moved out of the available range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Choose another slot</AlertTitle>
            <AlertDescription>
              Go back to the consultation page or the doctor details page and select a different appointment time.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="gap-3">
          <Button asChild variant="outline">
            <Link href="/consultation">Back to Consultation</Link>
          </Button>
          <Button asChild>
            <Link href={`/consultation/doctor/${doctorId}`}>Open Doctor Details</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl border bg-linear-to-r from-cyan-50 via-white to-blue-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Confirm Your Appointment</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Review the selected time slot, choose how you want to pay, and finish your appointment booking.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">Patient checkout</Badge>
            <Badge variant="secondary">Stripe payment supported</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Doctor & Schedule</CardTitle>
            <CardDescription>Make sure the doctor and slot match what you want to book.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-start gap-4 rounded-2xl border bg-muted/20 p-4">
              <Avatar className="size-16 ring-2 ring-blue-100">
                <AvatarImage src={doctorProfilePhoto} alt={doctorName} />
                <AvatarFallback>{getInitials(doctorName)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-1">
                <p className="text-lg font-semibold">{doctorName}</p>
                <p className="text-sm text-muted-foreground">{doctorDesignation || "N/A"}</p>
                <p className="text-sm text-muted-foreground">{doctorWorkingPlace || "N/A"}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Starts</p>
                <p className="mt-2 text-sm font-medium">{formatDateTime(scheduleStart)}</p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Ends</p>
                <p className="mt-2 text-sm font-medium">{formatDateTime(scheduleEnd)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>Choose whether to pay now at checkout or keep the appointment unpaid for later.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">Consultation fee</p>
              <p className="mt-1 text-3xl font-semibold">৳{appointmentFee?.toFixed(2) ?? "0.00"}</p>
            </div>

            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>Payment choices</AlertTitle>
              <AlertDescription>
                Pay now opens Stripe checkout. Pay later keeps the booking in your appointments list so you can complete payment later.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button
              type="button"
              className="w-full"
              onClick={() => void handlePayNow()}
              disabled={payNowMutation.isPending || payLaterMutation.isPending}
            >
              <CreditCard className="size-4" />
              {payNowMutation.isPending ? "Redirecting to Payment..." : "Confirm & Pay Now"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void handlePayLater()}
              disabled={payNowMutation.isPending || payLaterMutation.isPending}
            >
              <Wallet className="size-4" />
              {payLaterMutation.isPending ? "Booking..." : "Book & Pay Later"}
            </Button>

            <Button asChild variant="ghost" className="w-full">
              <Link href={`/consultation/doctor/${doctorId}`}>Back to Doctor Details</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default AppointmentBookingConfirmation