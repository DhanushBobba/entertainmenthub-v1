# EntertainHub

EntertainHub is a web application for discovering movies and live events and managing ticket bookings. Customers can browse entertainment, make and track bookings, and update their profiles. Administrators can manage movies, events, categories, customers, and bookings, and view dashboard statistics.

## Technology

- **Frontend:** React 19, Vite, React Router, Axios
- **Backend:** Java 21+, Spring Boot 3.4, Spring MVC, Maven
- **Authentication and data:** Supabase Auth and Supabase Postgres REST API
- **Charts and icons:** Recharts and Lucide

The backend validates Supabase access tokens and role/profile status, then calls Supabase Auth, PostgREST tables, and database RPC functions. The Supabase secret key must only be configured on the backend.

## Repository layout

```text
frontend/
  src/
    api/                 Axios API modules
    context/             Authentication state
    layouts/             Customer and admin shells
    pages/               Auth, customer, and admin pages
    routes/              Protected frontend routes
backend/
  src/main/java/         Spring Boot application and API
  src/main/resources/    Spring configuration
  .env.example           Backend environment-variable template
```

## Features

### Customer

- Register and sign in using Supabase Auth
- Browse movies and events, with search/filter and details
- Create movie or event bookings
- View booking history and cancel eligible bookings
- Update profile name and phone number

### Administrator

- View dashboard statistics, recent bookings, and upcoming events
- Create, edit, and deactivate movies and categories
- Create, edit, and cancel events
- Review bookings and change eligible booking statuses
- Search customers and activate or deactivate accounts

## Requirements

- Java 21 or newer
- Maven 3.9+
- Node.js 22 LTS (or a version supported by the installed Vite release)
- npm
- A Supabase project with the required database tables and RPC functions

## Supabase setup

1. Create or select a Supabase project.
2. In the Supabase dashboard, open **Project Settings → API** (or **API Keys**, depending on the dashboard version).
3. Copy the **Project URL**, **publishable key**, and **secret key**.
4. Ensure the project has the database objects expected by the backend. The backend reads these tables:
   - `profiles`
   - `categories`
   - `movies`
   - `events`
   - `bookings`
5. The backend calls these Postgres RPC functions:
   - `create_booking(p_user_id, p_booking_type, p_item_id, p_quantity)`
   - `get_dashboard_statistics()`
6. Configure Supabase Auth to match the desired email-confirmation behavior. The frontend shows a confirmation message when signup does not return a session.

**Database migrations and RPC SQL definitions are not included in this repository.** The Supabase schema, profile creation behavior for new signups, policies, and RPC implementations must already be configured in your Supabase project. Booking validation and seat availability are enforced by the `create_booking` database function.

Never commit a real `.env` file or expose the Supabase secret key in frontend code. If a secret key is accidentally shared, revoke/rotate it in Supabase and update the local backend configuration.

## Local setup

Open two terminals from the repository root.

### 1. Configure the backend

In the first terminal:

```powershell
cd .\backend
Copy-Item .env.example .env
```

Edit `backend/.env` and set your Supabase values:

```dotenv
APP_NAME=EntertainHub
APP_ENV=development
API_PREFIX=/api
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
FRONTEND_URL=http://localhost:5173
PORT=8000
```

Start the backend **from the `backend` directory** so Spring Boot loads that directory's `.env`:

```powershell
mvn spring-boot:run
```

The backend listens on port `8000` by default. To build a runnable JAR:

```powershell
mvn clean package
java -jar .\target\entertainhub-backend-1.0.0.jar
```

### 2. Configure and start the frontend

In a second terminal:

```powershell
cd .\frontend
npm install
```

Create `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api
```

Start Vite:

```powershell
npm run dev
```

Open the **Local** URL printed by Vite, normally <http://localhost:5173/>.

Vite reads `.env.local` at startup. Restart the Vite process after changing it.

## Verify the services

- Frontend: <http://localhost:5173/>
- Backend root: <http://localhost:8000/>
- Backend health: <http://localhost:8000/health>
- API-prefixed health: <http://localhost:8000/api/health>

The root endpoint returns a welcome message and version. The health endpoint returns the service name and `healthy` status. API requests from the frontend use the `/api` prefix and include the current Supabase access token as a bearer token.

## API overview

All business endpoints use the `/api` prefix. Protected endpoints require:

```http
Authorization: Bearer <supabase-access-token>
```

| Area | Routes | Access |
|---|---|---|
| Authentication | `/auth/register`, `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout` | Public or authenticated as appropriate |
| Categories | `/categories/` and `/categories/{categoryId}` | Authenticated reads; admin writes |
| Movies | `/movies/` and `/movies/{movieId}` | Authenticated reads; admin writes |
| Events | `/events/` and `/events/{eventId}` | Authenticated reads; admin writes |
| Bookings | `/bookings/`, `/bookings/{bookingId}`, and booking status/cancel actions | Customers see their own bookings; admins manage all |
| Users | `/users/`, `/users/me`, and `/users/{userId}` | Customers update their own profile; admin customer management |
| Dashboard | `/dashboard/statistics`, `/dashboard/recent-bookings`, `/dashboard/upcoming-events` | Admin |

Movie, event, booking, and customer listing endpoints support pagination. Movie/event listing endpoints also support search and filters; refer to the controller parameters and frontend API modules for exact query parameter names.

## Useful development commands

Frontend, from `frontend/`:

```powershell
npm run lint
npm run build
```

Backend, from `backend/`:

```powershell
mvn test
mvn clean package
```

## Notes

- Frontend route protection improves navigation, but authorization is enforced again by the backend using the profile role.
- Customer movie/event listings exclude unavailable statuses. The booking RPC is the final authority for availability, ticket price, and seat checks.
- Movie and category deletion is implemented as deactivation; event deletion is implemented as cancellation.
- Authentication tokens are stored in browser `sessionStorage`.
