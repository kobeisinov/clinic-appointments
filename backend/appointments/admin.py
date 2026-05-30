from django.contrib import admin
from .models import Doctor, Slot, Appointment

admin.site.register(Doctor)
admin.site.register(Slot)
admin.site.register(Appointment)
