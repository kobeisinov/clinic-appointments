from datetime import datetime, timezone

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Doctor, Slot, Appointment

CLINIC_ID = "clinic-1"
HEADERS = {"HTTP_CLINIC_ID": CLINIC_ID}


def make_slot(doctor, start_time=None, status=Slot.Status.FREE):
    return Slot.objects.create(
        clinic_id=CLINIC_ID,
        doctor=doctor,
        start_time=start_time or datetime(2024, 1, 15, 9, 0, tzinfo=timezone.utc),
        duration=30,
        status=status,
    )


class BookingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.doctor = Doctor.objects.create(
            clinic_id=CLINIC_ID,
            name="Dr. Smith",
            specialization="General",
        )

    def test_book_free_slot_succeeds(self):
        slot = make_slot(self.doctor)
        response = self.client.post(
            "/api/appointments/",
            {"slot": slot.id, "patient_name": "Alice", "patient_phone": "+1234567890"},
            format="json",
            **HEADERS,
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(Appointment.objects.filter(slot=slot).exists())
        slot.refresh_from_db()
        self.assertEqual(slot.status, Slot.Status.BOOKED)

    def test_rebook_booked_slot_rejected(self):
        slot = make_slot(self.doctor)
        # First booking
        self.client.post(
            "/api/appointments/",
            {"slot": slot.id, "patient_name": "Alice", "patient_phone": "+1234567890"},
            format="json",
            **HEADERS,
        )
        # Second booking attempt
        response = self.client.post(
            "/api/appointments/",
            {"slot": slot.id, "patient_name": "Bob", "patient_phone": "+0987654321"},
            format="json",
            **HEADERS,
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(Appointment.objects.filter(slot=slot).count(), 1)

    def test_clinic_isolation_blocks_cross_clinic_slot(self):
        other_slot = Slot.objects.create(
            clinic_id="clinic-2",
            doctor=self.doctor,
            start_time=datetime(2024, 1, 15, 10, 0, tzinfo=timezone.utc),
            duration=30,
        )
        response = self.client.post(
            "/api/appointments/",
            {"slot": other_slot.id, "patient_name": "Eve", "patient_phone": "+1111111111"},
            format="json",
            **HEADERS,
        )
        self.assertIn(response.status_code, [400, 404])
        self.assertFalse(Appointment.objects.filter(slot=other_slot).exists())
