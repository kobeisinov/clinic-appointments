from django.http import JsonResponse


class ClinicMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        clinic_id = request.headers.get("Clinic-Id")
        if not clinic_id:
            return JsonResponse({"detail": "Clinic-Id header is required."}, status=400)
        request.clinic_id = clinic_id
        return self.get_response(request)
