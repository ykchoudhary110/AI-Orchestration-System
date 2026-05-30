# FLN Compass - Installation & Running Guide

This guide details the step-by-step instructions to set up and run the **FLN Compass** system on Windows, macOS, or Linux devices.

---

## 🏗️ System Overview
FLN Compass is an **Offline-First Foundational Literacy & Numeracy (FLN) Diagnostic Intelligence System** designed to help educators track student reading/math gaps, evaluate speech/pronunciation metrics, and generate customized remediation plans locally.

### Key Features & Upgrades:
*   **Gateway Access & Security Validation**: Strict client-side route guards and login gateway validation.
    *   **Enforced Login**: Quick-bypass role buttons are removed. Users must log in via the formal gateway using their respective credentials.
    *   **Navbar Switcher Lock**: Students are restricted from switching roles via the navbar top-bar. If logged in as a student, the selector is hidden and a static read-only `Student` label is displayed to prevent privilege escalation.
*   **Dictation Literacy Module**: The Literacy assessment has been streamlined to `["dictation", "sentence_reading", "comprehension"]`, removing letter recognition and phonics.
    *   *Dictation*: Native offline-first Web Speech Synthesis (`window.speechSynthesis`) reads words aloud, and students type the spelling to check their literacy skills.
    *   *Sentence Reading*: Students read sentences aloud for speech-to-text evaluation.
    *   *Comprehension*: Standard reading understanding MCQ checks.
*   **Bulk Student CSV Import**: Upload a CSV file matching the structure: `Name,Age,Grade,Gender,Language`. Duplicates and conflicts are automatically checked.
*   **Phonetic Pronunciation Evaluation**: Evaluates reading speed (WPM), accuracy, and pronunciation using local Whisper speech-to-text.
*   **Local Audio Playback**: Spoken recordings are saved locally at `backend/static/audio/` and served via HTTP for teacher review.
*   **AI Question Generator**: Generate custom literacy and numeracy questions in multiple languages using local Gemma 3 4B.

---

## ⚙️ Prerequisites
Ensure you have the following installed on your machine:
1.  **Python 3.10 or 3.11** (Ensure it is added to your system PATH).
2.  **Node.js (v18 or higher)**.
3.  **LM Studio** (Optional, for local AI recommendations and question generation).

---

## 🚀 Installation & Running Steps

### Step 1: Set up the Python Backend
1.  Open your command terminal and navigate to the `backend` directory:
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
4.  Upgrade pip and install backend dependencies:
    ```bash
    python -m pip install --upgrade pip
    pip install fastapi uvicorn sqlalchemy pydantic requests pydantic-settings python-multipart faster-whisper
    ```
5.  Run the Uvicorn server:
    ```bash
    uvicorn main:app --host 127.0.0.1 --port 8000 --reload
    ```
    *The SQLite database (`fln_compass.db`) will automatically initialize and seed with multilingual dictation questions, schools, teachers, and mock student longitudinal logs.*

> [!NOTE]
> The very first time a student reads a sentence, the backend will download the tiny (70MB) Whisper model weights from Hugging Face and cache them locally under your home directory. Subsequent transcriptions run 100% offline.

---

### Step 2: Set up the React Frontend
1.  Open a new terminal window/tab and navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install the required packages:
    *   **macOS / Linux / Windows CMD**:
        ```bash
        npm install
        ```
    *   **Windows (PowerShell with script restrictions)**:
        If you encounter script execution restrictions while using PowerShell, run:
        ```powershell
        npm.cmd install
        ```
3.  Start the Vite dev server:
    *   **macOS / Linux / Windows CMD**:
        ```bash
        npm run dev -- --host 127.0.0.1
        ```
    *   **Windows (PowerShell)**:
        ```powershell
        npm.cmd run dev -- --host 127.0.0.1
        ```
4.  Open your browser and navigate to **`http://localhost:5173/`**.

---

## 🔑 Demonstration Credentials
To test the systems, use the following credentials on the login screen:

| Role | Email / Login ID | Password |
|---|---|---|
| **Admin** | `admin@fln.gov.in` | `admin123` |
| **Teacher** | `teacher@fln.gov.in` | `teacher123` |
| **Student** | Registered ID (e.g., `STU-1`, `STU-2`) | `student123` |

*Note: Available student login IDs are listed directly on the login screen for reference.*

---

## 🤖 Configuring Local AI (LM Studio Integration)
For offline classroom recommendations and student reports, you can run a local LLM:
1.  Open **LM Studio**.
2.  Search and download a small LLM like **Gemma 3 4B** or **Llama 3 8B**.
3.  Go to the **Local Server** tab in LM Studio.
4.  Select your downloaded LLM model and click **Start Server** on port `1234`.
5.  *Fallback behavior:* If LM Studio is not running, the system automatically uses a built-in deterministic rule-based mapping to generate recommendations and fallback questions.
