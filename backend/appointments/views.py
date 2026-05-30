from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework.response import Response

from .models import Doctor, Slot, Appointment
from .serializers import DoctorSerializer, SlotSerializer, AppointmentCreateSerializer, AppointmentSerializer


class DoctorListView(ListAPIView):
    serializer_class = DoctorSerializer

    def get_queryset(self):
        return Doctor.objects.filter(clinic_id=self.request.clinic_id)


class SlotListView(ListAPIView):
    serializer_class = SlotSerializer

    def get_queryset(self):
        doctor_id = self.kwargs["doctor_id"]
        date = self.request.query_params.get("date")
        qs = Slot.objects.filter(
            clinic_id=self.request.clinic_id,
            doctor_id=doctor_id,
        )
        if date:
            qs = qs.filter(start_time__date=date)
        return qs.filter(start_time__gte=timezone.now())


class AppointmentCreateView(CreateAPIView):
    serializer_class = AppointmentCreateSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        slot = serializer.validated_data["slot"]

        try:
            with transaction.atomic():
                # Re-check status inside transaction with row lock to prevent race
                locked_slot = Slot.objects.select_for_update().get(pk=slot.pk)
                if locked_slot.status == Slot.Status.BOOKED:
                    return Response(
                        {"detail": "This slot is already booked."},
                        status=status.HTTP_409_CONFLICT,
                    )
                appointment = Appointment.objects.create(
                    slot=locked_slot,
                    patient_name=serializer.validated_data["patient_name"],
                    patient_phone=serializer.validated_data["patient_phone"],
                )
                locked_slot.status = Slot.Status.BOOKED
                locked_slot.save(update_fields=["status"])
        except IntegrityError:
            return Response(
                {"detail": "This slot is already booked."},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)
