export interface IScheduleDoctorAssignment {
  doctorId: string
  scheduleId: string
  isBooked?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
}

export interface IScheduleAppointment {
  id?: string
  status?: string
  createdAt?: string | Date
  doctor?: {
    id?: string | number
    name?: string
    email?: string
  } | null
  patient?: {
    id?: string | number
    name?: string
    email?: string
  } | null
}

export interface ISchedule {
  id: string
  startDateTime: string | Date
  endDateTime: string | Date
  createdAt?: string | Date
  updatedAt?: string | Date
  doctorSchedules?: IScheduleDoctorAssignment[]
  appointments?: IScheduleAppointment[]
}

export interface ICreateSchedulePayload {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

export interface IUpdateSchedulePayload {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}
