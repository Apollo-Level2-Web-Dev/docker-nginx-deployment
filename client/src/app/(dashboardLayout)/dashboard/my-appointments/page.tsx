import PatientAppointmentsList from "@/components/modules/Patient/Appointments/PatientAppointmentsList"
import { getMyAppointments } from "@/services/appointment.services"

const getFeedbackState = (status?: string, error?: string) => {
  if (error === "payment_cancelled") {
    return {
      type: "error" as const,
      message: "Payment was cancelled. Your appointment is still saved and you can pay again anytime.",
    }
  }

  if (status === "pay_later_booked") {
    return {
      type: "success" as const,
      message: "Appointment booked successfully with pay later.",
    }
  }

  return null
}

const MyAppointmentsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>
}) => {
  const params = await searchParams
  const response = await getMyAppointments()
  const feedback = getFeedbackState(params.status, params.error)

  return (
    <PatientAppointmentsList
      appointments={response.data}
      feedbackType={feedback?.type}
      feedbackMessage={feedback?.message}
    />
  )
}

export default MyAppointmentsPage