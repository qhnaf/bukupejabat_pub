# Buku Pejabat V2 - Technical Documentation

## 1. Overview
Buku Pejabat V2 is a modernized web application designed for comprehensive personnel and organizational unit management. Tailored for government or diplomatic use (indicated by modules like *Dalam Negeri*, *Luar Negeri*, and *Konsul Kehormatan*), it acts as a centralized directory and management system for employees (`Pegawai`) and their respective work units (`Unit Kerja`).

## 2. Technology Stack
The project uses a modern monolithic architecture with a decoupled React frontend and Laravel backend, connected via REST API.

### Backend (API)
- **Framework:** Laravel 12.0 (PHP 8.2+)
- **Authentication:** Laravel Sanctum (Token-based API auth)
- **Database ORM:** Eloquent ORM
- **Database Engine:** MySQL / PostgreSQL / SQLite (Configurable via `.env`)

### Frontend (SPA)
- **Library:** React 19.2 (using JSX)
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS v4, DaisyUI v5, Headless UI
- **Build Tool:** Vite v7
- **Utilities:** Axios (API Requests), SweetAlert2 (Notifications), jsPDF & XLSX (Export features)

## 3. System Architecture & Directory Structure
The application follows an API-driven SPA (Single Page Application) approach. `routes/web.php` acts as a catch-all to serve the React application, while `routes/api.php` handles all data transactions.

### Key Directories
- `app/Http/Controllers/Api/` - Contains REST API controllers (e.g., `PegawaiController`, `UnitKerjaController`).
- `app/Models/` - Eloquent ORM models defining database table structures and relationships.
- `database/migrations/` - Database schema versions and table creation scripts.
- `routes/api.php` - API endpoint definitions.
- `resources/js/src/` - The root of the React frontend application.
  - `components/` - Reusable UI components.
  - `pages/` - Main page views (e.g., `Dashboard`, `DataPegawai`, `LuarNegeri`).
  - `layouts/` - Page wrapper layouts (e.g., Sidebar, Navbar).
  - `utils/` - Helper functions and configuration.

## 4. Key Entities (Database Models)
1. **User:** Manages system access, authentication, and role-based permissions. Can be linked to a specific `UnitKerja` to restrict admin scope.
2. **Pegawai:** Represents an employee or official. Contains personal data and is linked to a `UnitKerja` and a `Jabatan`.
3. **UnitKerja:** Represents an organizational unit (e.g., Embassies, Consulates, internal directorates). Contains contact details, work hours, and timezone differences.
4. **Jabatan:** Represents the job titles or positions available.
5. **KonsulKehormatan & PejabatKonsul:** Specialized models for managing Honorary Consuls and their respective officials.
6. **ActivityLog:** An audit trail model that automatically tracks sensitive system actions (CRUD operations) performed by users.

## 5. Core Features
- **Authentication & Authorization:** Secure token-based login. Supports varying roles (e.g., Superadmin, Unit Admin).
- **Employee Directory (Pegawai):** Full CRUD operations for employee data, including advanced filtering and search capabilities.
- **Work Unit Management (Unit Kerja):** Categorized management of Domestic (*Dalam Negeri*) and Foreign (*Luar Negeri*) units, detailing location, work hours, and seasonal variations.
- **Data Synchronization & Cleansing:** API endpoints to sync master data from JSON sources and perform data cleansing.
- **Exporting & Reporting:** Frontend capabilities to export data to Excel (`xlsx`) and PDF (`jsPDF`) formats.
- **Audit Logging:** System-wide tracking of changes to ensure accountability.

## 6. Installation & Local Development Setup

### Prerequisites
- PHP ^8.2
- Composer
- Node.js & npm
- A local database server (e.g., MySQL via Laragon/XAMPP)

### Steps
1. **Clone the repository** (if applicable) or navigate to the project root.
2. **Install Backend Dependencies:**
   ```bash
   composer install
   ```
3. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```
4. **Environment Setup:**
   - Copy `.env.example` to `.env`
   - Generate application key: `php artisan key:generate`
   - Configure your database credentials in the `.env` file (`DB_DATABASE`, `DB_USERNAME`, etc.)
5. **Database Migration:**
   ```bash
   php artisan migrate
   ```
6. **Start the Development Servers:**
   You need to run both the frontend build process and the backend server simultaneously.
   - **Terminal 1 (Backend):**
     ```bash
     php artisan serve
     ```
   - **Terminal 2 (Frontend):**
     ```bash
     npm run dev
     ```
7. Open your browser and navigate to the address provided by `php artisan serve` (usually `http://localhost:8000`).
