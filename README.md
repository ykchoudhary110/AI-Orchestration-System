# FLN Compass - Frontend Clickable Prototype

> [!IMPORTANT]
> This branch (`prototype-deployment`) represents the **Frontend-Only Clickable Prototype Version** of FLN Compass. It has been optimized for hackathon judging, user experience walk-throughs, and simple hosting on static platforms like Vercel.
>
> The full production version operates completely offline using local FastAPI servers, local SQLite databases, LM Studio (Gemma 3), and local faster-whisper models. That code is kept separate in the main offline development branches.

---

## 🏗️ System Overview
FLN Compass is a Foundational Literacy and Numeracy (FLN) Diagnostic Portal. This prototype provides a fully populated, navigable, and interactive product experience that simulates the entire system completely client-side in the browser:
*   **Zero Server Setup**: No FastAPI backend, SQLite databases, or local LLMs are required. All queries, analytics, and record creations are handled locally and saved to `localStorage`.
*   **Fully Navigable Dashboards**: 
    *   **Admin**: Register new schools, manage teachers, and explore the master question bank or upload bulk student CSVs.
    *   **Teacher**: Launch assessments, view struggling student alerts, track learning gaps, and analyze risk trends.
    *   **Student**: Review reading progress charts, see the interactive learning fingerprint (radar chart), and launch practice board reading drills.
*   **Interactive Assessments Flow**: Fully clickable adaptive test loops simulating MCQ questions, speech pronunciation evaluations, and dictation voice synthesis.
*   **Mic Recording & Playback**: Microphone audio recording works in the browser, creating temporary local Blob URLs for immediate playback inside the dashboard.
*   **Prototype Information Side Panel**: A sticky sidebar (or collapsible panel on mobile) explaining the design architecture, with quick navigation buttons pointing to the project repositories and architectural documents.

---

## ⚙️ Running Locally

Follow these instructions to run the prototype on your system:

### 1. Navigate to the Prototype Folder
Open your command terminal and enter the project folder:
```bash
cd clickable-prototype
```

### 2. Install Frontend Dependencies
Install Vite, Tailwind, Recharts, and Lucide icons:
*   **macOS / Linux / Windows CMD**:
    ```bash
    npm install
    ```
*   **Windows (PowerShell)**:
    If your PowerShell setup blocks script execution, run:
    ```powershell
    npm.cmd install
    ```

### 3. Start the Development Server
Launch the local Vite server:
*   **macOS / Linux / Windows CMD**:
    ```bash
    npm run dev
    ```
*   **Windows (PowerShell)**:
    ```powershell
    npm.cmd run dev
    ```

### 4. Open in Browser
Open your browser and navigate to **`http://localhost:5173/`**.

---

## 🔑 Demonstration Credentials
Use these credentials on the login screen:

| Role | Email / Login ID | Password |
|---|---|---|
| **Admin** | `admin@fln.gov.in` | `admin123` |
| **Teacher** | `teacher@fln.gov.in` | `teacher123` |
| **Student** | Select a registered ID (e.g. `STU-1`, `STU-2`) | `student123` |

*Note: Available student login IDs are listed directly on the login screen for easy testing.*
