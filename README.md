# Sport Booking Backend

Backend system for booking sport courts (Badminton, Football, Tennis, etc.). Built with NestJS, Prisma, and PostgreSQL.

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Database Setup

Ensure you have PostgreSQL running and .env configured.

```bash
npx prisma generate
npx prisma db push
```

### 3. Run Application

```bash
npm run start:dev
```

Server will start at: http://localhost:5000

## Timezone Handling

All API inputs are treated as Vietnam Local Time (UTC+7).

- Input: Date strings sent to the API are interpreted as Local Time.
- Storage: Data is converted and stored in the database as UTC.
- Output: Response messages convert UTC back to Vietnam Local Time.

## API Documentation

### 1. Create Casual Booking

Creates a single booking session.

**Endpoint**
POST /api/v1/bookings

**Headers**
Authorization: Bearer <token>

**Request Body**

```json
{
  "courtId": 1,
  "startTime": "2026-01-05T10:00:00.000Z",
  "endTime": "2026-01-05T12:00:00.000Z",
  "type": "Casual",
  "notes": "Casual match"
}
```

**Response (201 Created)**

```json
{
  "id": 1,
  "userId": 1,
  "courtId": 1,
  "startTime": "2026-01-05T03:00:00.000Z",
  "endTime": "2026-01-05T05:00:00.000Z",
  "totalPrice": 100000,
  "notes": "Casual match",
  "type": "Casual",
  "status": "Pending",
  "message_time": "Đã đặt sân từ 2026-01-05 10:00 đến 2026-01-05 12:00 (Giờ VN)"
}
```

### 2. Create Fixed Booking

Creates recurring bookings for a specified number of weeks.

**Endpoint**
POST /api/v1/bookings/fixed

**Headers**
Authorization: Bearer <token>

**Request Body**

```json
{
  "courtId": 1,
  "startDate": "2026-01-01T00:00:00.000Z",
  "daysOfWeek": [1, 3, 5],
  "startHour": 18,
  "durationHours": 2,
  "weeks": 4,
  "notes": "Monthly schedule"
}
```

**Parameters Description**
- daysOfWeek: Array of integers representing days (0=Sunday, 1=Monday, ..., 6=Saturday).
- startDate: The baseline date to start calculating the schedule.
- startHour: Starting hour in local time (0-23).
- durationHours: Duration of the booking in hours.
- weeks: Number of weeks to repeat the schedule.

**Response (201 Created)**

```json
{
  "count": 12,
  "bookings": [
    {
      "id": 2,
      "courtId": 1,
      "startTime": "2026-01-02T11:00:00.000Z",
      "endTime": "2026-01-02T13:00:00.000Z",
      "type": "Monthly",
      "status": "Pending"
    }
  ]
}
```

### 3. Get Court Schedule

Retrieves the schedule for a specific court within a date range.

**Endpoint**
GET /api/v1/courts/:id/schedule

**Headers**
Authorization: Bearer <token>

**Query Parameters**
- from: Start date (ISO format)
- to: End date (ISO format)

**Example Request**
GET /api/v1/courts/1/schedule?from=2026-01-01T00:00:00.000Z&to=2026-01-31T23:59:59.000Z

**Response (200 OK)**

```json
{
  "courtId": 1,
  "courtName": "Court A",
  "status": "occupied",
  "bookings": [
    {
      "id": 1,
      "startTime": "2026-01-05T03:00:00.000Z",
      "endTime": "2026-01-05T05:00:00.000Z",
      "status": "Pending"
    }
  ]
}
```

### 4. Get My Bookings

Retrieves bookings for the currently authenticated user.

**Endpoint**
GET /api/v1/bookings/me

**Headers**
Authorization: Bearer <token>

**Query Parameters**
- status (optional): Filter by status (Pending, Confirmed, Cancelled).

### 5. Get Booking Detail

Retrieves details of a specific booking.

**Endpoint**
GET /api/v1/bookings/:id

**Headers**
Authorization: Bearer <token>

### 6. Cancel Booking

Cancels a specific booking.

**Endpoint**
POST /api/v1/bookings/:id/cancel

**Headers**
Authorization: Bearer <token>

## Tech Stack

- Framework: NestJS
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Authentication: Passport, JWT
- Utilities: class-validator, class-transformer
