export type AppointmentStatus =
  | "SCHEDULED"
  | "INPROGRESS"
  | "COMPLETED"
  | "CANCELED"
  | string

export type PaymentStatus = "PAID" | "UNPAID" | "FAILED" | string

export interface IAppointmentDoctor {
  id?: string
  name?: string
  email?: string
  profilePhoto?: string
  designation?: string
  currentWorkingPlace?: string
  appointmentFee?: number
}

export interface IAppointmentPatient {
  id?: string
  name?: string
  email?: string
}

export interface IAppointmentSchedule {
  id?: string
  startDateTime?: string | Date
  endDateTime?: string | Date
}

export interface IAppointmentPayment {
  id?: string
  amount?: number
  transactionId?: string
  status?: PaymentStatus
  invoiceUrl?: string | null
}

export interface IAppointment {
  id: string
  doctorId?: string
  patientId?: string
  scheduleId?: string
  videoCallingId?: string
  status?: AppointmentStatus
  paymentStatus?: PaymentStatus
  createdAt?: string | Date
  updatedAt?: string | Date
  doctor?: IAppointmentDoctor | null
  patient?: IAppointmentPatient | null
  schedule?: IAppointmentSchedule | null
  payment?: IAppointmentPayment | null
}

export interface IBookAppointmentPayload {
  doctorId: string
  scheduleId: string
}

export interface IBookAppointmentResult {
  appointment: IAppointment
  payment?: IAppointmentPayment
  paymentUrl?: string | null
}

export interface IInitiatePaymentResult {
  paymentUrl: string
}