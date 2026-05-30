# FLN Compass - Installation & Running Guide

This guide details the step-by-step instructions to set up and run the **FLN Compass** system on any Windows, macOS, or Linux device.

---

## 🏗️ System Overview
FLN Compass is an **Offline-First Foundational Literacy & Numeracy (FLN) Intelligence System** that helps teachers diagnose student reading/math gaps, log performance, and receive AI classroom recommendations.

*   **Frontend**: React (Vite, Tailwind CSS, Recharts)
*   **Backend**: FastAPI (Python)
*   **Local Database**: SQLite
*   **Offline speech-to-text**: Python `faster-whisper` (runs completely locally on CPU)
*   **Local LLM recommendations**: LM Studio (Gemma 3 4B)

---

## ⚙️ Prerequisites
Ensure you have the following installed on your machine:
1.  **Python 3.10 or 3.11** (Ensure it is added to your system PATH).
2.  **Node.js (v18 or higher)**.
3.  **LM Studio** (Optional, for offline Gemma 3 4B recommendations).

---

## 🚀 Installation Steps

### Step 1: Set up the Python Backend
1.  Open your command terminal and navigate to the project directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv .venv
    ```
3.  Activate the virtual environment:
    *   **Windows (PowerShell)**:
        ```powershell
        .venv\Scripts\Activate.ps1
        ```
    *   **Windows (CMD)**:
        ```cmd
        .venv\Scripts\activate.bat
        ```
    *   **macOS / Linux**:
        ```bash
        source .venv/bin/activate
        ```
4.  Upgrade pip:
    ```bash
    python -m pip install --upgrade pip
    ```
5.  Install all backend dependencies:
    ```bash
    pip install fastapi uvicorn sqlalchemy pydantic requests pydantic-settings python-multipart faster-whisper
    ```

> [!NOTE]
> The very first time a student reads a sentence, the backend will download the tiny (70MB) Whisper model weights from Hugging Face and cache them locally under your home directory. Subsequent transcriptions run 100% offline.

---

### Step 2: Set up the React Frontend
1.  Open a new terminal window/tab and navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install the required packages:
    ```bash
    npm install
    ```

---

## 🏃 Running the Application

### 1. Run the Backend Server
1.  Navigate to the project root directory.
2.  Activate the python virtual environment:
    ```bash
    .venv\Scripts\activate
    ```
3.  Run the Uvicorn server:
    ```bash
    uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
    ```
    *The database (`fln_compass.db`) will be auto-seeded with mock student profiles and a diagnostic question bank on launch.*

### 2. Run the Frontend Dev Server
1.  Navigate to the `frontend` directory.
2.  Start the Vite dev server:
    ```bash
    npm run dev -- --host 127.0.0.1
    ```
3.  Open your browser and navigate to **`http://localhost:5173/`**.

---

## 🤖 Configuring Local AI (LM Studio Integration)
For offline classroom recommendations and student reports, you can run a local LLM:
1.  Open **LM Studio**.
2.  Search and download a small LLM like **Gemma 3 4B** or **Llama 3 8B**.
3.  Go to the **Local Server** tab in LM Studio.
4.  Select your downloaded LLM model and click **Start Server** on port `1234`.
5.  *Fallback behavior:* If LM Studio is not running, the system automatically uses a built-in deterministic rule-based mapping (consisting of 33 pedagogical rules) to generate recommendations instantly.
