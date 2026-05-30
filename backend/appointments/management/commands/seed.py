from datetime import datetime, timezone, timedelta
from django.core.management.base import BaseCommand
from appointments.models import Doctor, Slot


class Command(BaseCommand):
    help = "Seed the database with sample clinic data"

    def handle(self, *args, **options):
        clinic_id = "clinic-1"

        Doctor.objects.filter(clinic_id=clinic_id).delete()

        doctors = [
            Doctor.objects.create(clinic_id=clinic_id, name="Айгерим Бекова", specialization="Терапевт"),
            Doctor.objects.create(clinic_id=clinic_id, name="Арман Сейткали", specialization="Кардиолог"),
            Doctor.objects.create(clinic_id=clinic_id, name="Динара Нурланова", specialization="Невролог"),
        ]

        # Astana is UTC+5. 09:00 local = 04:00 UTC. Slots run 09:00–16:30 local time.
        astana_offset = timezone(timedelta(hours=5))
        base_date = datetime(2026, 5, 30, 9, 0, tzinfo=astana_offset)
        for doctor in doctors:
            for day in range(5):
                for slot_num in range(16):  # 09:00–16:30, every 30 min
                    Slot.objects.create(
                        clinic_id=clinic_id,
                        doctor=doctor,
                        start_time=base_date + timedelta(days=day, minutes=slot_num * 30),
                        duration=30,
                    )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(doctors)} doctors with slots. Use Clinic-Id: {clinic_id}"
        ))
