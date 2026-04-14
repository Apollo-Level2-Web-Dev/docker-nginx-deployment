export interface IDoctorScheduleDoctor {
  id?: string
  name?: string
  email?: string
  user?: {
    id?: string
    name?: string
    email?: string
    role?: string
    status?: string
  }
}

export interface IDoctorSchedule {
  doctorId: string
  scheduleId: string
  isBooked: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  schedule?: {
    id: string
    startDateTime: string | Date
    endDateTime: string | Date
    createdAt?: string | Date
    updatedAt?: string | Date
  }
  doctor?: IDoctorScheduleDoctor
}

export interface ICreateDoctorSchedulePayload {
  scheduleIds: string[]
}

export interface IUpdateDoctorSchedulePayload {
  scheduleIds: Array<{
    shouldDelete: boolean
    id: string
  }>
}
