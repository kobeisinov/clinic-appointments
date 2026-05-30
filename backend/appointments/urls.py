from django.urls import path
from .views import DoctorListView, SlotListView, AppointmentCreateView

urlpatterns = [
    path("doctors/", DoctorListView.as_view()),
    path("doctors/<int:doctor_id>/slots/", SlotListView.as_view()),
    path("appointments/", AppointmentCreateView.as_view()),
]
