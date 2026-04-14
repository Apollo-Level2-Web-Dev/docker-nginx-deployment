"use server";

import { httpClient } from "@/lib/axios/httpClient";
import { ICreateDoctorPayload, IDoctor, IDoctorDetails, IUpdateDoctorPayload } from "@/types/doctor.types";
import { ISpecialty } from "@/types/specialty.types";


export const getDoctors = async (queryString : string) => {
    try {
        const doctors = await httpClient.get<IDoctor[]>(queryString ? `/doctors?${queryString}` : "/doctors");
        return doctors;
    } catch (error) {
        console.log("Error fetching doctors:", error);
        throw error;
    }
}

export const getAllSpecialties = async () => {
    try {
        const specialties = await httpClient.get<ISpecialty[]>("/specialties");
        return specialties;
    } catch (error) {
        console.log("Error fetching specialties:", error);
        throw error;
    }
}

export const createDoctor = async (payload: ICreateDoctorPayload) => {
    try {
        const response = await httpClient.post<IDoctor>("/users/create-doctor", payload);
        return response;
    } catch (error) {
        console.log("Error creating doctor:", error);
        throw error;
    }
}

export const updateDoctor = async (id: string, payload: IUpdateDoctorPayload) => {
    try {
        const response = await httpClient.patch<IDoctor>(`/doctors/${id}`, payload);
        return response;
    } catch (error) {
        console.log("Error updating doctor:", error);
        throw error;
    }
}

export const deleteDoctor = async (id: string) => {
    try {
        const response = await httpClient.delete<{ message: string }>(`/doctors/${id}`);
        return response;
    } catch (error) {
        console.log("Error deleting doctor:", error);
        throw error;
    }
}

export const getDoctorById = async (id: string) => {
    try {
        const doctor = await httpClient.get<IDoctorDetails>(`/doctors/${id}`);
        return doctor;
    } catch (error) {
        console.log("Error fetching doctor by id:", error);
        throw error;
    }
}