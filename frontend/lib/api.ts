import axios from "axios";

const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID ?? "clinic-1";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    "Clinic-Id": CLINIC_ID,
  },
});

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
}

export interface Slot {
  id: number;
  start_time: string;
  duration: number;
  status: "free" | "booked";
}

export interface AppointmentPayload {
  slot: number;
  patient_name: string;
  patient_phone: string;
}

export const fetchDoctors = (): Promise<Doctor[]> =>
  api.get("/doctors/").then((r) => r.data);

export const fetchSlots = (doctorId: number, date: string): Promise<Slot[]> =>
  api.get(`/doctors/${doctorId}/slots/`, { params: { date } }).then((r) => r.data);

export const createAppointment = (payload: AppointmentPayload) =>
  api.post("/appointments/", payload).then((r) => r.data);
