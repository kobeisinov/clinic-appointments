from rest_framework import serializers
from .models import Doctor, Slot, Appointment


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ["id", "name", "specialization"]


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = ["id", "start_time", "duration", "status"]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["slot", "patient_name", "patient_phone"]
        # Suppress DRF's auto-generated unique validator on the OneToOneField —
        # uniqueness is enforced atomically in the view via select_for_update + IntegrityError.
        extra_kwargs = {"slot": {"validators": []}}

    def validate_slot(self, slot):
        request = self.context["request"]
        if slot.clinic_id != request.clinic_id:
            raise serializers.ValidationError("Slot does not belong to this clinic.")
        return slot


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ["id", "slot", "patient_name", "patient_phone", "created_at"]
