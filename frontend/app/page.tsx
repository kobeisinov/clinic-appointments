"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDoctors, fetchSlots, Slot } from "@/lib/api";
import BookingModal from "@/components/BookingModal";

export default function Home() {
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [date, setDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: fetchDoctors,
  });

  const slotsQuery = useQuery({
    queryKey: ["slots", doctorId, date],
    queryFn: () => fetchSlots(doctorId!, date),
    enabled: !!doctorId && !!date,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-800">Запись к врачу</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Doctor + date selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="font-medium text-gray-700">Выберите врача и дату</h2>

          {doctorsQuery.isLoading && (
            <p className="text-sm text-gray-400">Загрузка врачей...</p>
          )}
          {doctorsQuery.isError && (
            <p className="text-sm text-red-500">Не удалось загрузить список врачей.</p>
          )}
          {doctorsQuery.isSuccess && (
            <select
              value={doctorId ?? ""}
              onChange={(e) => {
                setDoctorId(Number(e.target.value) || null);
                setDate("");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Выберите врача —</option>
              {doctorsQuery.data.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.specialization}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={!doctorId}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>

        {/* Slots list */}
        {doctorId && date && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-medium text-gray-700 mb-4">Доступные слоты</h2>

            {slotsQuery.isLoading && (
              <p className="text-sm text-gray-400">Загрузка слотов...</p>
            )}
            {slotsQuery.isError && (
              <p className="text-sm text-red-500">Не удалось загрузить слоты.</p>
            )}
            {slotsQuery.isSuccess && slotsQuery.data.length === 0 && (
              <p className="text-sm text-gray-400">Нет слотов на выбранную дату.</p>
            )}
            {slotsQuery.isSuccess && slotsQuery.data.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slotsQuery.data.map((slot) => {
                  const time = new Date(slot.start_time).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isFree = slot.status === "free";
                  return (
                    <button
                      key={slot.id}
                      disabled={!isFree}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium text-center transition-colors ${
                        isFree
                          ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                          : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {time}
                      <span className="block text-xs font-normal mt-0.5">
                        {isFree ? "Свободно" : "Занято"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedSlot && doctorId && date && (
        <BookingModal
          slot={selectedSlot}
          doctorId={doctorId}
          date={date}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}
