"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAppointment, Slot } from "@/lib/api";
import axios from "axios";

interface Props {
  slot: Slot;
  doctorId: number;
  date: string;
  onClose: () => void;
}

interface FormErrors {
  patient_name?: string;
  patient_phone?: string;
}

const PHONE_PREFIX = "+7 ";

function formatPhone(raw: string): string {
  // Keep only digits after the +7 prefix
  const digits = raw.replace(/\D/g, "").slice(1); // remove leading 7
  const d = digits.slice(0, 10);
  let result = PHONE_PREFIX;
  if (d.length > 0) result += d.slice(0, 3);
  if (d.length > 3) result += " " + d.slice(3, 6);
  if (d.length > 6) result += " " + d.slice(6, 8);
  if (d.length > 8) result += " " + d.slice(8, 10);
  return result;
}

function validate(name: string, phone: string): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) errors.patient_name = "Введите имя пациента";
  else if (name.trim().length < 2) errors.patient_name = "Имя слишком короткое";

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 11) errors.patient_phone = "Введите полный номер телефона";

  return errors;
}

export default function BookingModal({ slot, doctorId, date, onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createAppointment({ slot: slot.id, patient_name: name, patient_phone: phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", doctorId, date] });
      onClose();
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setServerError("Этот слот уже занят. Пожалуйста, выберите другое время.");
      } else {
        setServerError("Произошла ошибка. Попробуйте ещё раз.");
      }
    },
  });

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");
    const errs = validate(name, phone);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    mutation.mutate();
  };

  const timeStr = new Date(slot.start_time).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">Запись на приём</h2>
        <p className="text-sm text-gray-500 mb-5">Время: {timeStr}, {slot.duration} мин</p>

        {mutation.isSuccess ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-medium text-lg">Запись подтверждена!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя пациента
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Қайрат Нұртасұлы Айдарбеков"
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.patient_name ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.patient_name && (
                <p className="text-red-500 text-xs mt-1">{errors.patient_name}</p>
              )}
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Номер телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val.startsWith(PHONE_PREFIX)) {
                    setPhone(PHONE_PREFIX);
                  } else {
                    setPhone(formatPhone(val));
                  }
                }}
                placeholder="+7 700 000 00 00"
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.patient_phone ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.patient_phone && (
                <p className="text-red-500 text-xs mt-1">{errors.patient_phone}</p>
              )}
            </div>

            {serverError && (
              <p className="text-red-500 text-sm mb-4">{serverError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {mutation.isPending ? "Отправка..." : "Записаться"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
