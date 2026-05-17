# Commuter — Backend Schema

> Target stack: **Laravel 11 + MySQL 8**. All timestamps are UTC ISO-8601. All monetary values are in **EGP**. Snake_case throughout.

---

## Table of Contents

1. [Database Tables](#1-database-tables)
2. [Relationships](#2-relationships)
3. [Enumerations](#3-enumerations)
4. [API Endpoints](#4-api-endpoints)
5. [Authentication & Sessions](#5-authentication--sessions)
6. [Pricing Formula](#6-pricing-formula)
7. [Business Rules](#7-business-rules)

---

## 1. Database Tables

### 1.1 `users`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `name` | `varchar(120)` | NOT NULL | |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | |
| `phone` | `varchar(20)` | UNIQUE, NOT NULL | |
| `password` | `varchar(255)` | NOT NULL | bcrypt |
| `gender` | `enum('male','female')` | NOT NULL | |
| `date_of_birth` | `date` | NOT NULL | min age 18 enforced |
| `avatar_url` | `varchar(500)` | NULLABLE | S3 path |
| `rating` | `decimal(3,2)` | DEFAULT 5.00 | updated after each cycle |
| `total_cycles` | `int` | DEFAULT 0 | |
| `active_cycles` | `int` | DEFAULT 0 | |
| `wallet_balance` | `decimal(10,2)` | DEFAULT 0.00 | |
| `gender_pref` | `enum('same','mixed')` | NOT NULL | |
| `walk_minutes` | `tinyint` | DEFAULT 0 | 0, 5, or 10 |
| `seat_preference` | `enum('any','front','rear-window')` | DEFAULT 'any' | |
| `is_verified` | `boolean` | DEFAULT false | email verified |
| `joined_at` | `timestamp` | NOT NULL | |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 1.2 `drivers`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `name` | `varchar(120)` | NOT NULL | |
| `email` | `varchar(255)` | UNIQUE, NOT NULL | |
| `phone` | `varchar(20)` | UNIQUE, NOT NULL | |
| `password` | `varchar(255)` | NOT NULL | bcrypt |
| `gender` | `enum('male','female')` | NOT NULL | |
| `date_of_birth` | `date` | NOT NULL | |
| `address` | `varchar(255)` | NOT NULL | |
| `national_id` | `varchar(14)` | UNIQUE, NOT NULL | 14-digit Egyptian NID |
| `driving_license_number` | `varchar(30)` | UNIQUE, NOT NULL | |
| `rating` | `decimal(3,2)` | DEFAULT 5.00 | |
| `total_trips` | `int` | DEFAULT 0 | |
| `wallet_balance` | `decimal(10,2)` | DEFAULT 0.00 | |
| `is_verified` | `boolean` | DEFAULT false | email verified |
| `is_approved` | `boolean` | DEFAULT false | admin document approval |
| `completed_cycles` | `int` | DEFAULT 0 | |
| `active_cycles` | `int` | DEFAULT 0 | |
| `joined_at` | `timestamp` | NOT NULL | |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 1.3 `vehicles`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `driver_id` | `uuid` | FK → `drivers.id` | |
| `brand` | `varchar(60)` | NOT NULL | e.g. "Toyota" |
| `model` | `varchar(60)` | NOT NULL | e.g. "Corolla" |
| `year` | `smallint` | NOT NULL | |
| `color` | `varchar(40)` | NOT NULL | |
| `license_plate` | `varchar(20)` | UNIQUE, NOT NULL | |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 1.4 `driver_documents`

One row per driver (1:1). Columns hold S3 object keys.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `driver_id` | `uuid` | FK → `drivers.id`, UNIQUE | |
| `profile_photo` | `varchar(500)` | NULLABLE | |
| `national_id_front` | `varchar(500)` | NULLABLE | |
| `national_id_back` | `varchar(500)` | NULLABLE | |
| `driving_license` | `varchar(500)` | NULLABLE | |
| `car_license` | `varchar(500)` | NULLABLE | |
| `criminal_record` | `varchar(500)` | NULLABLE | |
| `admin_note` | `text` | NULLABLE | rejection reason |
| `reviewed_at` | `timestamp` | NULLABLE | |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 1.5 `saved_locations`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → `users.id` | |
| `label` | `enum('home','work','custom')` | NOT NULL | |
| `name` | `varchar(80)` | NOT NULL | display name |
| `address` | `varchar(255)` | NOT NULL | |
| `lat` | `decimal(10,7)` | NOT NULL | |
| `lng` | `decimal(10,7)` | NOT NULL | |
| `created_at` | `timestamp` | | |

---

### 1.6 `ride_groups`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `code` | `varchar(7)` | UNIQUE, NOT NULL | format: `XXX-XXX` |
| `creator_id` | `uuid` | FK → `users.id` | |
| `type` | `enum('friends','open')` | NOT NULL | |
| `max_members` | `tinyint` | NOT NULL | 3 (shared) or 4 (private) |
| `expires_at` | `timestamp` | NOT NULL | 48h after creation |
| `created_at` | `timestamp` | | |

---

### 1.7 `ride_group_members`

Pivot table for group membership.

| Column | Type | Constraints |
|---|---|---|
| `group_id` | `uuid` | FK → `ride_groups.id`, PK part |
| `user_id` | `uuid` | FK → `users.id`, PK part |
| `joined_at` | `timestamp` | NOT NULL |

---

### 1.8 `cycle_requests`

The main booking entity — one row per weekly cycle request submitted by a passenger.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → `users.id` | |
| `driver_id` | `uuid` | FK → `drivers.id`, NULLABLE | set on match |
| `group_id` | `uuid` | FK → `ride_groups.id`, NULLABLE | if group request |
| `status` | `enum` | NOT NULL | see §3 |
| `ride_type` | `enum('shared','private')` | NOT NULL | |
| `trip_type` | `enum('one_way','round_trip')` | NOT NULL | |
| `gender_pref` | `enum('same','mixed')` | NOT NULL | |
| `seat_preference` | `enum('any','front-passenger','rear-left','rear-right')` | DEFAULT 'any' | |
| `seat_extra_cost` | `tinyint` | DEFAULT 0 | EGP surcharge for seat |
| `walk_minutes` | `tinyint` | DEFAULT 0 | 0, 5, or 10 |
| `passenger_count` | `tinyint` | DEFAULT 1 | includes group members |
| `origin_address` | `varchar(255)` | NOT NULL | |
| `origin_lat` | `decimal(10,7)` | NOT NULL | |
| `origin_lng` | `decimal(10,7)` | NOT NULL | |
| `destination_address` | `varchar(255)` | NOT NULL | |
| `destination_lat` | `decimal(10,7)` | NOT NULL | |
| `destination_lng` | `decimal(10,7)` | NOT NULL | |
| `distance_km` | `decimal(6,2)` | NOT NULL | |
| `duration_minutes` | `smallint` | NOT NULL | |
| `cycle_start_date` | `date` | NOT NULL | auto-computed: next valid weekday |
| `cycle_end_date` | `date` | NOT NULL | always `cycle_start_date + 6 days` |
| `base_price` | `decimal(8,2)` | NOT NULL | driver's listed weekly price |
| `offered_price` | `decimal(8,2)` | NULLABLE | driver counter-offer |
| `estimated_price_min` | `decimal(8,2)` | NOT NULL | |
| `estimated_price_max` | `decimal(8,2)` | NOT NULL | |
| `group_type` | `enum('friends','open')` | NULLABLE | |
| `group_action` | `enum('create','join')` | NULLABLE | |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 1.9 `time_slots`

Per-slot schedule entries attached to a cycle request. A request has one slot per distinct route/day combination.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `cycle_request_id` | `uuid` | FK → `cycle_requests.id` | |
| `trip_type` | `enum('one_way','round_trip')` | NOT NULL | |
| `origin_address` | `varchar(255)` | NULLABLE | may differ per slot |
| `origin_lat` | `decimal(10,7)` | NULLABLE | |
| `origin_lng` | `decimal(10,7)` | NULLABLE | |
| `destination_address` | `varchar(255)` | NULLABLE | |
| `destination_lat` | `decimal(10,7)` | NULLABLE | |
| `destination_lng` | `decimal(10,7)` | NULLABLE | |
| `route_distance_km` | `decimal(6,2)` | NULLABLE | |
| `route_duration_minutes` | `smallint` | NULLABLE | |
| `route_coordinates` | `json` | NULLABLE | `[[lng,lat],...]` |
| `route_summary` | `varchar(255)` | NULLABLE | |
| `route_set` | `boolean` | DEFAULT false | |
| `return_origin_address` | `varchar(255)` | NULLABLE | round_trip only |
| `return_origin_lat` | `decimal(10,7)` | NULLABLE | |
| `return_origin_lng` | `decimal(10,7)` | NULLABLE | |
| `return_destination_address` | `varchar(255)` | NULLABLE | |
| `return_destination_lat` | `decimal(10,7)` | NULLABLE | |
| `return_destination_lng` | `decimal(10,7)` | NULLABLE | |
| `return_route_distance_km` | `decimal(6,2)` | NULLABLE | |
| `return_route_duration_minutes` | `smallint` | NULLABLE | |
| `return_route_coordinates` | `json` | NULLABLE | |
| `return_route_summary` | `varchar(255)` | NULLABLE | |
| `return_customized` | `boolean` | DEFAULT false | |
| `pickup_from` | `varchar(5)` | NOT NULL | `HH:MM` |
| `pickup_to` | `varchar(5)` | NOT NULL | |
| `arrival_from` | `varchar(5)` | NOT NULL | computed |
| `arrival_to` | `varchar(5)` | NOT NULL | computed |
| `return_pickup_from` | `varchar(5)` | NULLABLE | |
| `return_pickup_to` | `varchar(5)` | NULLABLE | |
| `return_arrival_from` | `varchar(5)` | NULLABLE | |
| `return_arrival_to` | `varchar(5)` | NULLABLE | |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 1.10 `time_slot_days`

Normalizes the `days[]` array on each `TimeSlot`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `time_slot_id` | `uuid` | FK → `time_slots.id`, PK part | |
| `day` | `enum('Sat','Sun','Mon','Tue','Wed','Thu','Fri')` | PK part | |

---

### 1.11 `time_slot_stops`

Intermediate stops for private rides (max 2 per slot).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `time_slot_id` | `uuid` | FK → `time_slots.id` | |
| `order` | `tinyint` | NOT NULL | 1-based |
| `address` | `varchar(255)` | NOT NULL | |
| `lat` | `decimal(10,7)` | NOT NULL | |
| `lng` | `decimal(10,7)` | NOT NULL | |

---

### 1.12 `pickup_points`

Per-passenger pickup location within a shared cycle request.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `cycle_request_id` | `uuid` | FK → `cycle_requests.id` | |
| `passenger_id` | `uuid` | FK → `users.id` | |
| `passenger_gender` | `enum('male','female')` | NOT NULL | denormalized for filtering |
| `lat` | `decimal(10,7)` | NOT NULL | |
| `lng` | `decimal(10,7)` | NOT NULL | |
| `address` | `varchar(255)` | NOT NULL | |
| `pickup_time_offset` | `tinyint` | DEFAULT 0 | minutes after cycle departure |

---

### 1.13 `daily_trips`

One row per calendar day per active cycle. Generated nightly by a scheduled job for the following day.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `cycle_request_id` | `uuid` | FK → `cycle_requests.id` | |
| `driver_id` | `uuid` | FK → `drivers.id` | |
| `date` | `date` | NOT NULL | `YYYY-MM-DD` |
| `status` | `enum('scheduled','starting_soon','active','completed','cancelled')` | NOT NULL | |
| `driver_lat` | `decimal(10,7)` | NULLABLE | live — updated via WebSocket/polling |
| `driver_lng` | `decimal(10,7)` | NULLABLE | |
| `driver_heading` | `smallint` | NULLABLE | degrees 0–360 |
| `current_stop_index` | `tinyint` | DEFAULT 0 | |
| `trip_started_at` | `timestamp` | NULLABLE | |
| `trip_completed_at` | `timestamp` | NULLABLE | |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

---

### 1.14 `trip_stops`

One row per passenger per `daily_trip`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `daily_trip_id` | `uuid` | FK → `daily_trips.id` | |
| `passenger_id` | `uuid` | FK → `users.id` | |
| `pickup_lat` | `decimal(10,7)` | NOT NULL | |
| `pickup_lng` | `decimal(10,7)` | NOT NULL | |
| `pickup_address` | `varchar(255)` | NOT NULL | |
| `dropoff_lat` | `decimal(10,7)` | NOT NULL | |
| `dropoff_lng` | `decimal(10,7)` | NOT NULL | |
| `dropoff_address` | `varchar(255)` | NOT NULL | |
| `passenger_code` | `varchar(4)` | NOT NULL | deterministic 4-digit code |
| `scheduled_pickup` | `varchar(5)` | NOT NULL | `HH:MM` |
| `scheduled_dropoff` | `varchar(5)` | NOT NULL | |
| `actual_pickup` | `varchar(5)` | NULLABLE | filled on confirmation |
| `actual_dropoff` | `varchar(5)` | NULLABLE | filled on drop-off |
| `status` | `enum('pending','arriving','waiting','picked_up','no_show','dropped_off')` | NOT NULL | |
| `wait_started_at` | `timestamp` | NULLABLE | driver arrived at pickup point |
| `created_at` | `timestamp` | | |
| `updated_at` | `timestamp` | | |

**Code generation rule:** `passenger_code = hash(passenger_id + trip_date + cycle_id) % 9000 + 1000` — always 4 digits, deterministic, regenerated daily.

---

### 1.15 `cycle_day_records`

Historical log of each day's outcome for completed/active cycles.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `cycle_request_id` | `uuid` | FK → `cycle_requests.id` | |
| `date` | `date` | NOT NULL | |
| `driver_name` | `varchar(120)` | NULLABLE | denormalized snapshot |
| `pickup_time` | `varchar(5)` | NULLABLE | actual `HH:MM` |
| `dropoff_time` | `varchar(5)` | NULLABLE | actual `HH:MM` |
| `status` | `enum('completed','cancelled')` | NULLABLE | `null` = passenger no-show |

---

### 1.16 `wallet_transactions`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `owner_id` | `uuid` | NOT NULL | `users.id` or `drivers.id` |
| `owner_type` | `enum('user','driver')` | NOT NULL | polymorphic |
| `type` | `enum('top_up','payment','refund')` | NOT NULL | |
| `amount` | `decimal(8,2)` | NOT NULL | positive; direction inferred from `type` |
| `description` | `varchar(255)` | NOT NULL | |
| `balance_after` | `decimal(10,2)` | NOT NULL | snapshot after transaction |
| `created_at` | `timestamp` | | |

---

### 1.17 `notifications`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → `users.id` | |
| `type` | `enum(...)` | NOT NULL | see §3 — Notification types |
| `title` | `varchar(120)` | NOT NULL | |
| `body` | `text` | NOT NULL | |
| `is_read` | `boolean` | DEFAULT false | |
| `action_url` | `varchar(255)` | NULLABLE | deep link |
| `created_at` | `timestamp` | | |

---

### 1.18 `ratings`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `cycle_request_id` | `uuid` | FK → `cycle_requests.id` | |
| `reviewer_id` | `uuid` | FK → `users.id` | the passenger |
| `driver_id` | `uuid` | FK → `drivers.id` | |
| `stars` | `tinyint` | NOT NULL | 1–5 |
| `comment` | `text` | NULLABLE | |
| `submitted_at` | `timestamp` | NOT NULL | |

**Constraint:** one rating per `(cycle_request_id, reviewer_id)` pair.

---

### 1.19 `password_reset_tokens`

| Column | Type | Constraints |
|---|---|---|
| `email` | `varchar(255)` | PK |
| `token` | `varchar(255)` | NOT NULL (hashed) |
| `created_at` | `timestamp` | |

---

## 2. Relationships

```
users ──< saved_locations
users ──< cycle_requests (as requester)
users ──< ride_group_members >── ride_groups
users ──< pickup_points
users ──< trip_stops (as passenger)
users ──< wallet_transactions (polymorphic)
users ──< notifications
users ──< ratings (as reviewer)

drivers ──1 vehicles
drivers ──1 driver_documents
drivers ──< cycle_requests (assigned driver)
drivers ──< daily_trips
drivers ──< wallet_transactions (polymorphic)
drivers ──< ratings (as subject)

cycle_requests ──< time_slots
time_slots ──< time_slot_days
time_slots ──< time_slot_stops (private, max 2)
cycle_requests ──< pickup_points
cycle_requests ──< daily_trips
cycle_requests ──< cycle_day_records
cycle_requests >── ride_groups

daily_trips ──< trip_stops
```

---

## 3. Enumerations

### Request Status

| Value | Meaning |
|---|---|
| `submitted` | User submitted; awaiting system processing |
| `matching` | System searching for compatible driver pool |
| `finding_driver` | Group formed; contacting drivers |
| `available` | Visible to drivers on the driver portal |
| `driver_offered` | A driver accepted at the listed price |
| `price_raised` | Driver counter-offered a higher price |
| `confirmed` | Passenger accepted; cycle is locked |
| `active` | Current week's trips are running |
| `completed` | All cycle days finished |
| `cancelled` | Cancelled by passenger, driver, or system |

### Notification Types

| Value |
|---|
| `request_matched` |
| `price_raised` |
| `request_confirmed` |
| `cycle_starting_tomorrow` |
| `cycle_completed` |
| `payment_deducted` |
| `refund_issued` |
| `request_cancelled` |

---

## 4. API Endpoints

Base URL: `/api/v1`

Authentication header: `Authorization: Bearer {token}`

---

### 4.1 Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/user/register` | — | Passenger sign-up (steps 1–2 in one call) |
| `POST` | `/auth/driver/register` | — | Driver sign-up multipart (steps 1–3, documents uploaded) |
| `POST` | `/auth/user/login` | — | Passenger sign-in → `AuthResponse` |
| `POST` | `/auth/driver/login` | — | Driver sign-in → `AuthResponse` |
| `POST` | `/auth/forgot-password` | — | Send reset link to email |
| `POST` | `/auth/reset-password` | — | Consume token, set new password |
| `POST` | `/auth/logout` | ✓ | Revoke token |

#### `POST /auth/user/register` — Request body

```json
{
  "name": "Sara Khaled",
  "email": "sara@example.com",
  "password": "••••••••",
  "password_confirmation": "••••••••",
  "gender": "female",
  "date_of_birth": "1998-04-12",
  "gender_pref": "same",
  "walk_minutes": 5
}
```

#### `POST /auth/driver/register` — `multipart/form-data` fields

```
name, email, phone, password, password_confirmation,
address, national_id, date_of_birth,
car_brand, car_model, car_year, car_color, license_plate, driving_license_number,
profile_photo (file), national_id_front (file), national_id_back (file),
driving_license (file), car_license (file), criminal_record (file)
```

#### `AuthResponse` shape

```json
{
  "token": "string",
  "role": "user | driver",
  "user_id": "uuid",
  "name": "string",
  "is_verified": true,
  "is_approved": true
}
```

---

### 4.2 User — Profile

| Method | Path | Description |
|---|---|---|
| `GET` | `/user/profile` | Get own `UserProfile` |
| `PATCH` | `/user/profile` | Update name, phone, preferences |
| `POST` | `/user/profile/avatar` | Upload avatar (`multipart/form-data`) |
| `GET` | `/user/saved-locations` | List saved locations |
| `POST` | `/user/saved-locations` | Add location |
| `DELETE` | `/user/saved-locations/{id}` | Remove location |

---

### 4.3 User — Cycle Requests

| Method | Path | Description |
|---|---|---|
| `GET` | `/user/requests` | List own requests (all statuses) |
| `GET` | `/user/requests/{id}` | Get single request with full detail |
| `POST` | `/user/requests` | Submit new cycle request |
| `POST` | `/user/requests/{id}/accept-price` | Accept driver's counter-offer |
| `POST` | `/user/requests/{id}/reject-price` | Reject counter-offer |
| `DELETE` | `/user/requests/{id}` | Cancel request |

#### `POST /user/requests` — Request body

```json
{
  "ride_type": "shared",
  "trip_type": "round_trip",
  "gender_pref": "same",
  "seat_preference": "front-passenger",
  "walk_minutes": 5,
  "group_type": null,
  "group_action": null,
  "group_code": null,
  "time_slots": [
    {
      "trip_type": "round_trip",
      "origin": { "address": "Maadi", "lat": 29.9602, "lng": 31.2569 },
      "stops": [],
      "destination": { "address": "New Cairo", "lat": 30.0099, "lng": 31.4312 },
      "route_distance_km": 32.1,
      "route_duration_minutes": 55,
      "route_coordinates": [[31.2569, 29.9602], ["..."]],
      "pickup_from": "07:00",
      "pickup_to": "08:00",
      "return_pickup_from": "16:30",
      "return_pickup_to": "17:30",
      "days": ["Sun", "Mon", "Tue", "Wed", "Thu"]
    }
  ]
}
```

---

### 4.4 User — Live Trip

| Method | Path | Description |
|---|---|---|
| `GET` | `/user/trips/{tripId}` | Get `DailyTrip` state (polling) |
| `POST` | `/user/trips/{tripId}/sos` | Trigger SOS alert |

---

### 4.5 User — Wallet

| Method | Path | Description |
|---|---|---|
| `GET` | `/user/wallet` | Balance + recent transactions |
| `POST` | `/user/wallet/top-up` | Top up via payment gateway |

---

### 4.6 User — Notifications

| Method | Path | Description |
|---|---|---|
| `GET` | `/user/notifications` | List notifications (latest first) |
| `POST` | `/user/notifications/{id}/read` | Mark single as read |
| `POST` | `/user/notifications/read-all` | Mark all as read |

---

### 4.7 User — Ratings

| Method | Path | Description |
|---|---|---|
| `POST` | `/user/ratings` | Submit driver rating after cycle |

#### Request body

```json
{
  "cycle_request_id": "uuid",
  "driver_id": "uuid",
  "stars": 5,
  "comment": "Very punctual!"
}
```

---

### 4.8 Driver — Profile

| Method | Path | Description |
|---|---|---|
| `GET` | `/driver/profile` | Get own `DriverProfile` |
| `PATCH` | `/driver/profile` | Update phone, address |
| `POST` | `/driver/documents` | Re-upload a document (`multipart/form-data`) |

---

### 4.9 Driver — Requests (Available Pool)

| Method | Path | Description |
|---|---|---|
| `GET` | `/driver/requests` | List available requests matching driver profile |
| `GET` | `/driver/requests/{id}` | Get full request detail |
| `POST` | `/driver/requests/{id}/accept` | Accept at listed price |
| `POST` | `/driver/requests/{id}/raise` | Propose a higher price |
| `POST` | `/driver/requests/{id}/reject` | Reject (hide from feed) |

#### `POST /driver/requests/{id}/raise` — Request body

```json
{ "offered_price": 2200 }
```

---

### 4.10 Driver — My Cycles

| Method | Path | Description |
|---|---|---|
| `GET` | `/driver/cycles` | List confirmed + active + completed cycles |
| `GET` | `/driver/cycles/{id}` | Get cycle with `cycle_days` history |

---

### 4.11 Driver — Live Trip

| Method | Path | Description |
|---|---|---|
| `GET` | `/driver/trips/{tripId}` | Get `DailyTrip` state |
| `PATCH` | `/driver/trips/{tripId}/location` | Push live GPS coordinates |
| `POST` | `/driver/trips/{tripId}/stops/{stopId}/arrive` | Mark arriving at stop |
| `POST` | `/driver/trips/{tripId}/stops/{stopId}/confirm` | Confirm pickup with 4-digit code |
| `POST` | `/driver/trips/{tripId}/stops/{stopId}/no-show` | Mark passenger no-show |
| `POST` | `/driver/trips/{tripId}/stops/{stopId}/dropoff` | Confirm drop-off |
| `POST` | `/driver/trips/{tripId}/complete` | Mark full trip completed |

#### `PATCH /driver/trips/{tripId}/location` — Request body

```json
{ "lat": 30.0626, "lng": 31.3417, "heading": 270 }
```

#### `POST .../stops/{stopId}/confirm` — Request body

```json
{ "code": "4821" }
```

---

### 4.12 Groups

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/groups` | User | Create a ride group → returns `code` |
| `POST` | `/groups/join` | User | Join by code |
| `GET` | `/groups/{id}` | User | Get group + members |
| `DELETE` | `/groups/{id}` | User (creator) | Disband group |

---

### 4.13 Shared — Geocoding & Routing

These proxy external APIs server-side to protect API keys.

| Method | Path | Description |
|---|---|---|
| `GET` | `/geo/autocomplete?q={text}&lat={}&lng={}` | Places autocomplete (Google) |
| `GET` | `/geo/details?place_id={id}` | Place details → `{lat, lng, address}` |
| `GET` | `/geo/reverse?lat={}&lng={}` | Reverse geocode (Nominatim) |
| `GET` | `/geo/route?origin={lat,lng}&dest={lat,lng}&waypoints={lat,lng|...}` | Driving route (ORS) → `ORSRoute[]` |

---

## 5. Authentication & Sessions

- **Mechanism:** Laravel Sanctum bearer tokens (stateless API)
- **Token lifetime:** 7 days; refreshed on activity
- **Storage (client):** `localStorage` + `HttpOnly`-style cookie (`commuter_token`) for middleware SSR reads
- **Roles:** `user` | `driver` — enforced by route middleware (`auth:user`, `auth:driver`)
- **Driver extra gate:** `is_approved = true` required to access driver request feed and trip endpoints
- **Password hashing:** bcrypt (Laravel default, cost factor 12)
- **Reset tokens:** hashed in `password_reset_tokens`, expire after 60 minutes

---

## 6. Pricing Formula

Base rate: **EGP 4 / km**

```
per_trip = (distance_km × 4 × ride_type_mult + seat_fee_egp)
           × (1 + walk_discount)
           × round_trip_mult

per_week = per_trip × days_per_week
```

| Factor | Value |
|---|---|
| `ride_type_mult` (shared) | `1.0` |
| `ride_type_mult` (private) | `2.2` |
| `walk_discount` (0 min) | `0%` |
| `walk_discount` (5 min) | `-8%` |
| `walk_discount` (10 min) | `-15%` |
| `round_trip_mult` (one_way) | `1.0` |
| `round_trip_mult` (round_trip) | `1.8` |
| `seat_fee` (any) | `0 EGP` |
| `seat_fee` (rear-window) | `8 EGP` |
| `seat_fee` (front) | `10 EGP` |

**Price range presented to user:** `min = floor(per_week × 0.9)`, `max = ceil(per_week × 1.1)`

---

## 7. Business Rules

### Cycle Scheduling
- `cycle_start_date` is auto-computed server-side: the **next calendar week** starting on the first selected `WeekDay` at or after the submission date.
- `cycle_end_date = cycle_start_date + 6 days` (always a full 7-day window).
- `daily_trips` rows are created by a **nightly scheduled job** (Laravel Queue + Scheduler) at 00:00 for the following day, only for dates matching the slot's `days[]`.

### Driver Matching
- An available request is shown to drivers whose vehicle capacity ≥ `passenger_count` and whose registered gender is compatible with `gender_pref`.
- A driver accepting a request moves it to `driver_offered`; passenger gets a notification.
- If no driver accepts within **24 hours**, status returns to `matching` and the cycle is re-broadcast.

### Pickup Code Validity
- Code is valid for **the calendar day** only — deterministic hash of `(passenger_id, trip_date, cycle_id)`.
- Driver must enter the code within the **3-minute wait window** after marking `waiting`.
- After 3 minutes without a code, the driver may mark `no_show`; the trip stop is locked.

### Group Rides
- Group code format: `XXX-XXX` (alphanumeric, no `0/O/1/I`), expires 48 hours after creation.
- Max members: 3 for `shared`, 4 for `private`.
- All group members share a single `cycle_request`; each gets their own `pickup_point` row.

### Payments
- Wallet is debited on `cycle_start_date` for the full `base_price` (or `offered_price` if counter-offer was accepted).
- If a trip day is `cancelled` by the driver, a pro-rated **refund** is issued automatically.
- If passenger is `no_show`, no refund for that day.

### Driver Approval
- New driver accounts have `is_approved = false`.
- Admin reviews documents in `driver_documents`; sets `is_approved = true` and optionally writes `admin_note`.
- Driver receives a push notification on approval or rejection.
