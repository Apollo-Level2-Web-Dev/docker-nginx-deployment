"use server"

import { httpClient } from "@/lib/axios/httpClient"
import {
    type ICreateSchedulePayload,
    type ISchedule,
    type IUpdateSchedulePayload,
} from "@/types/schedule.types"

export const getSchedules = async (queryString: string) => {
  try {
    return await httpClient.get<ISchedule[]>(
      queryString ? `/schedules?${queryString}` : "/schedules",
    )
  } catch (error) {
    console.log("Error fetching schedules:", error)
    throw error
  }
}

export const createSchedule = async (payload: ICreateSchedulePayload) => {
  try {
    return await httpClient.post<ISchedule[]>("/schedules", payload)
  } catch (error) {
    console.log("Error creating schedule:", error)
    throw error
  }
}

export const updateSchedule = async (id: string, payload: IUpdateSchedulePayload) => {
  try {
    return await httpClient.patch<ISchedule>(`/schedules/${id}`, payload)
  } catch (error) {
    console.log("Error updating schedule:", error)
    throw error
  }
}

export const deleteSchedule = async (id: string) => {
  try {
    return await httpClient.delete<boolean>(`/schedules/${id}`)
  } catch (error) {
    console.log("Error deleting schedule:", error)
    throw error
  }
}

export const getScheduleById = async (id: string) => {
  try {
    return await httpClient.get<ISchedule>(`/schedules/${id}`)
  } catch (error) {
    console.log("Error fetching schedule by id:", error)
    throw error
  }
}
