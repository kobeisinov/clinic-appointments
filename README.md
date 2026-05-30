# Clinic Appointments

Full-stack appointment booking system. Backend: Django + DRF. Frontend: Next.js + TypeScript.

## Requirements

- Python 3.11+
- Node.js 20+
- Docker Desktop

## Setup & Run

### 1. Start Postgres

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv ../venv
source ../venv/bin/activate   # Windows: ..\venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # then set a real SECRET_KEY inside
python manage.py migrate
python manage.py seed          # load sample doctors and slots
python manage.py runserver
```

Backend runs at http://localhost:8000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

All requests must include the `Clinic-Id` header. The frontend uses `clinic-1` by default (set via `NEXT_PUBLIC_CLINIC_ID`).

---

## Design Decisions

### Concurrent booking

Double-booking is prevented at the database level using a `OneToOneField` on `Appointment.slot`, which creates a unique constraint on the slot FK.

The booking view handles concurrent requests as follows:

1. The slot row is locked with `SELECT FOR UPDATE` inside an atomic transaction.
2. The slot status is re-checked under the lock.
3. The `Appointment` is inserted.
4. If two requests race, only one acquires the row lock first and proceeds. The second either sees status `booked` and returns 409, or hits the unique constraint (`IntegrityError`) and returns 409.

This gives two layers of protection: the row lock prevents unnecessary contention, and the unique constraint is the final DB-level guarantee that makes the correctness argument independent of application logic or timing.

The test suite covers booking a free slot (success) and re-booking the same slot (rejected). A threaded concurrent test is intentionally omitted: since the correctness guarantee lives in the DB constraint rather than in timing or application logic, the re-booking test exercises the exact same failure path that a losing concurrent request would hit. A threaded test would also require `TransactionTestCase` instead of `TestCase`, which is slower and adds complexity without strengthening the guarantee being tested.

### Clinic isolation

Every model (`Doctor`, `Slot`) carries a `clinic_id` field. A middleware reads the `Clinic-Id` request header and attaches it to `request.clinic_id`. All querysets filter by this value, so data from one clinic is never reachable from another. Cross-clinic slot booking attempts are rejected in the serializer's `validate_slot` method.

### Model extension

The base `Doctor` and `Slot` models were extended with a `clinic_id` field. This is required for clinic isolation — without it, there is no way to scope queries to a specific clinic at the DB level. Storing `clinic_id` directly on each model (rather than through a separate `Clinic` entity) keeps the schema simple and queries straightforward for this scope.

---

## Incomplete tasks

### Slot generation
Currently slots are created via a one-off seed command (`python manage.py seed`). In a production system this would be replaced with:

- A `Schedule` model representing a doctor's recurring weekly availability (e.g. Mon–Fri, 09:00–17:00, 30-minute intervals).
- A scheduled job (e.g. Celery beat or a cron-triggered management command) that runs nightly and generates `Slot` rows for the next N days based on each doctor's schedule.
- Logic to handle exceptions: holidays, doctor absences, slot cancellations.

This keeps the booking API unchanged — the frontend always works with pre-generated `Slot` rows regardless of how they were created.


---

## API

All endpoints require the `Clinic-Id` header.

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/doctors/` | List doctors for the clinic |
| GET | `/api/doctors/{id}/slots/?date=YYYY-MM-DD` | List slots for a doctor on a date |
| POST | `/api/appointments/` | Book a slot |

### POST /api/appointments/

Request body:
```json
{
  "slot": 1,
  "patient_name": "Айгерим Бекова",
  "patient_phone": "+7 700 000 00 00"
}
```

Responses:
- `201` — booked successfully
- `400` — validation error (missing fields, wrong clinic)
- `409` — slot already booked
