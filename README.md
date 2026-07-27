# Job Application Tracker

A full-stack web application for organizing and tracking job applications throughout the hiring process.

## Features

- User registration and login
- JWT-based authentication
- Private applications for each user
- Create, edit and delete job applications
- Search by company or position
- Filter by application status
- Pagination
- Follow-up reminders and private notes
- Light and dark themes
- Responsive interface
- Swagger/OpenAPI documentation

## Tech Stack

### Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway
- JWT authentication
- Maven
- JUnit and Mockito

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Vitest
- Testing Library

### Infrastructure

- Docker
- Docker Compose

## Project Structure

```text
job-application-tracker/
├── frontend/              # React frontend
├── src/main/java/         # Spring Boot backend
├── src/main/resources/    # Configuration and Flyway migrations
├── src/test/              # Backend tests
├── compose.yaml           # PostgreSQL container
└── pom.xml
```

## Running Locally

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Configure JWT secret

The backend requires a Base64-encoded secret containing at least 32 bytes.

PowerShell:

```powershell
$env:JWT_SECRET="your-base64-encoded-secret"
```

### 3. Start the backend

```powershell
.\mvnw.cmd spring-boot:run
```

The API will be available at:

```text
http://localhost:8080
```

Swagger UI:

```text
http://localhost:8080/swagger-ui/index.html
```

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

## Running Tests

Backend:

```powershell
.\mvnw.cmd test
```

Frontend:

```bash
cd frontend
npm test
npm run lint
npm run build
```

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`

### Applications

- `GET /api/applications`
- `GET /api/applications/{id}`
- `POST /api/applications`
- `PUT /api/applications/{id}`
- `DELETE /api/applications/{id}`

Protected endpoints require a JWT Bearer token.

## Author

Created as a portfolio project for practicing full-stack development with Java, Spring Boot, React and PostgreSQL.