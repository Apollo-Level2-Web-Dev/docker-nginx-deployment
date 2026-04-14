import AppointmentBookingConfirmation from "@/components/modules/Patient/Appointments/AppointmentBookingConfirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { getDoctorById } from "@/services/doctor.services"
import { type IDoctorDetails } from "@/types/doctor.types"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

const BookAppointmentsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ doctorId?: string; scheduleId?: string }>
}) => {
  const params = await searchParams
  const doctorId = params.doctorId?.trim() ?? ""
  const scheduleId = params.scheduleId?.trim() ?? ""

  if (!doctorId || !scheduleId) {
    return (
      <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Appointment details missing</AlertTitle>
          <AlertDescription>
            Select a doctor and time slot from the consultation pages before confirming a booking.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/consultation">Browse Doctors</Link>
        </Button>
      </section>
    )
  }

  let doctorDetails: IDoctorDetails | null = null

  try {
    const response = await getDoctorById(doctorId)
    doctorDetails = response.data
  } catch {
    doctorDetails = null
  }

  if (!doctorDetails) {
    return (
      <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Doctor details unavailable</AlertTitle>
          <AlertDescription>
            We could not load the selected doctor. Please return to consultation and try again.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/consultation">Back to Consultation</Link>
        </Button>
      </section>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedSchedule = (doctorDetails.doctorSchedules ?? []).find((item) => {
    const startDateTime = item.schedule?.startDateTime

    if (item.isBooked || item.schedule?.id !== scheduleId || !startDateTime) {
      return false
    }

    const parsedDate = new Date(startDateTime)
    return !Number.isNaN(parsedDate.getTime()) && parsedDate >= today
  })

  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8">
      <AppointmentBookingConfirmation
        doctorId={doctorId}
        scheduleId={scheduleId}
        doctorName={doctorDetails.name}
        doctorDesignation={doctorDetails.designation}
        doctorProfilePhoto={doctorDetails.profilePhoto}
        doctorWorkingPlace={doctorDetails.currentWorkingPlace}
        appointmentFee={doctorDetails.appointmentFee}
        scheduleStart={selectedSchedule?.schedule?.startDateTime}
        scheduleEnd={selectedSchedule?.schedule?.endDateTime}
        isScheduleAvailable={Boolean(selectedSchedule)}
      />
    </section>
  )
}

export default BookAppointmentsPage