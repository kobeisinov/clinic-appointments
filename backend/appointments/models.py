from django.db import models


class Doctor(models.Model):
    clinic_id = models.CharField(max_length=64)
    name = models.CharField(max_length=128)
    specialization = models.CharField(max_length=128)

    def __str__(self):
        return f"{self.name} ({self.specialization})"


class Slot(models.Model):
    class Status(models.TextChoices):
        FREE = "free", "Free"
        BOOKED = "booked", "Booked"

    clinic_id = models.CharField(max_length=64)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="slots")
    start_time = models.DateTimeField()
    duration = models.PositiveIntegerField(help_text="Duration in minutes")
    status = models.CharField(max_length=8, choices=Status.choices, default=Status.FREE)

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"Slot {self.id} — {self.doctor.name} at {self.start_time}"


class Appointment(models.Model):
    slot = models.OneToOneField(Slot, on_delete=models.CASCADE, related_name="appointment")
    patient_name = models.CharField(max_length=128)
    patient_phone = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Appointment for {self.patient_name} — slot {self.slot_id}"
