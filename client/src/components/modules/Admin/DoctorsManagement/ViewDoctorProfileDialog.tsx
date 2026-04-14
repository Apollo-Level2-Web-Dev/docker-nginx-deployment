"use client"

import { getDoctorByIdAction } from "@/app/(dashboardLayout)/admin/dashboard/doctors-management/_action"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type IDoctor, type IDoctorDetails } from "@/types/doctor.types"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"

interface ViewDoctorProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctor: IDoctor | null
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) {
    return "N/A"
  }

  const dateValue = new Date(value)
  if (Number.isNaN(dateValue.getTime())) {
    return "N/A"
  }

  return format(dateValue, "MMM dd, yyyy hh:mm a")
}

const getAverageRating = (reviews: IDoctorDetails["reviews"]) => {
  if (!reviews || reviews.length === 0) {
    return 0
  }

  const totalRating = reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0)
  return totalRating / reviews.length
}

const ViewDoctorProfileDialog = ({
  open,
  onOpenChange,
  doctor,
}: ViewDoctorProfileDialogProps) => {
  const doctorId = doctor ? String(doctor.id) : ""

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["doctor-details", doctorId],
    queryFn: () => getDoctorByIdAction(doctorId),
    enabled: open && doctorId.length > 0,
    staleTime: 1000 * 60,
  })

  const hasError = data && !data.success
  const doctorDetails = data && data.success ? data.data : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-3rem)] sm:max-w-[calc(100vw-3rem)] md:w-[calc(100vw-4rem)] md:max-w-[calc(100vw-4rem)] lg:w-[min(92vw,78rem)] lg:max-w-[min(92vw,78rem)] xl:w-[min(88vw,88rem)] xl:max-w-[min(88vw,88rem)] 2xl:w-[min(84vw,96rem)] 2xl:max-w-[min(84vw,96rem)]"
      >
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle>Doctor Profile</DialogTitle>
          <DialogDescription>
            Comprehensive profile view with doctor info, user account, schedules, appointments, and reviews.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-5.5rem)]">
          <div className="space-y-4 px-6 py-5">
            {(isLoading || isFetching) && (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                Loading doctor details...
              </div>
            )}

            {hasError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {data.message || "Failed to load doctor details."}
              </div>
            )}

            {!isLoading && !isFetching && doctorDetails && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">Doctor Info</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {doctorDetails.name || "N/A"}</p>
                      <p><span className="font-medium">Email:</span> {doctorDetails.email || "N/A"}</p>
                      <p><span className="font-medium">Contact:</span> {doctorDetails.contactNumber || "N/A"}</p>
                      <p><span className="font-medium">Gender:</span> {doctorDetails.gender || "N/A"}</p>
                      <p><span className="font-medium">Registration:</span> {doctorDetails.registrationNumber || "N/A"}</p>
                      <p><span className="font-medium">Experience:</span> {doctorDetails.experience ?? 0} years</p>
                      <p><span className="font-medium">Fee:</span> {doctorDetails.appointmentFee ?? "N/A"}</p>
                      <p><span className="font-medium">Qualification:</span> {doctorDetails.qualification || "N/A"}</p>
                      <p><span className="font-medium">Designation:</span> {doctorDetails.designation || "N/A"}</p>
                      <p><span className="font-medium">Current Workplace:</span> {doctorDetails.currentWorkingPlace || "N/A"}</p>
                      <p><span className="font-medium">Address:</span> {doctorDetails.address || "N/A"}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">User Account</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">User Name:</span> {doctorDetails.user?.name || "N/A"}</p>
                      <p><span className="font-medium">User Email:</span> {doctorDetails.user?.email || "N/A"}</p>
                      <p><span className="font-medium">Role:</span> {doctorDetails.user?.role || "N/A"}</p>
                      <p><span className="font-medium">Status:</span> {doctorDetails.user?.status || "N/A"}</p>
                      <p><span className="font-medium">Email Verified:</span> {doctorDetails.user?.emailVerified ? "Yes" : "No"}</p>
                      <p><span className="font-medium">Created:</span> {formatDateTime(doctorDetails.user?.createdAt)}</p>
                      <p><span className="font-medium">Updated:</span> {formatDateTime(doctorDetails.user?.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-semibold">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {doctorDetails.specialties?.length ? (
                      doctorDetails.specialties.map((item) => (
                        <Badge key={item.specialty.id} variant="secondary">
                          {item.specialty.title}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No specialties available.</span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">Reviews</h3>
                    <p className="mb-3 text-sm text-muted-foreground">
                      Total: {doctorDetails.reviews?.length ?? 0}, Average: {getAverageRating(doctorDetails.reviews).toFixed(1)}
                    </p>
                    <div className="space-y-2">
                      {(doctorDetails.reviews ?? []).slice(0, 5).map((review, index) => (
                        <div key={review.id ?? `review-${index}`} className="rounded-md border p-2 text-sm">
                          <p><span className="font-medium">Rating:</span> {review.rating ?? "N/A"}</p>
                          <p><span className="font-medium">Comment:</span> {review.comment || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(review.createdAt)}</p>
                        </div>
                      ))}
                      {!doctorDetails.reviews?.length && (
                        <p className="text-sm text-muted-foreground">No reviews available.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-3 text-sm font-semibold">Doctor Schedules</h3>
                    <div className="space-y-2">
                      {(doctorDetails.doctorSchedules ?? []).slice(0, 8).map((item, index) => (
                        <div key={item.id ?? item.schedule?.id ?? `schedule-${index}`} className="rounded-md border p-2 text-sm">
                          <p><span className="font-medium">Start:</span> {formatDateTime(item.schedule?.startDateTime)}</p>
                          <p><span className="font-medium">End:</span> {formatDateTime(item.schedule?.endDateTime)}</p>
                          <p><span className="font-medium">Booked:</span> {item.isBooked ? "Yes" : "No"}</p>
                        </div>
                      ))}
                      {!doctorDetails.doctorSchedules?.length && (
                        <p className="text-sm text-muted-foreground">No schedules available.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-semibold">Appointments</h3>
                  <div className="space-y-2">
                    {(doctorDetails.appointments ?? []).slice(0, 10).map((appointment, index) => (
                      <div key={appointment.id ?? `appointment-${index}`} className="rounded-md border p-2 text-sm">
                        <p><span className="font-medium">Patient:</span> {appointment.patient?.name || "N/A"}</p>
                        <p><span className="font-medium">Patient Email:</span> {appointment.patient?.email || "N/A"}</p>
                        <p><span className="font-medium">Status:</span> {appointment.status || "N/A"}</p>
                        <p><span className="font-medium">Schedule:</span> {formatDateTime(appointment.schedule?.startDateTime)}</p>
                        <p><span className="font-medium">Has Prescription:</span> {appointment.prescription ? "Yes" : "No"}</p>
                      </div>
                    ))}
                    {!doctorDetails.appointments?.length && (
                      <p className="text-sm text-muted-foreground">No appointments available.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default ViewDoctorProfileDialog