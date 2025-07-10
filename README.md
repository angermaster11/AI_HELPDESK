# 🧠 AI College HelpDesk Bot

An intelligent chatbot-based helpdesk system designed for colleges. It supports both text and voice queries, role-based authentication (Student, Staff, Admin), and real-time speech-to-text processing using `faster-whisper`.

---
System Desin file 
https://graceful-platinum-873.notion.site/AI-HelpDesk-Bot-22c088ad3c3a804c9bccd9ea68213c17?source=copy_link
## 📁 Project Folder Structure

```
graphql
CopyEdit
AI-College-HelpDesk-Bot/
│
├── app/                  # 🎯 FastAPI backend with LangGraph, Whisper, and WebSocket STT
│   ├── app.py
│   ├── requirements.txt
│   └── ... (services, models, routes, etc.)
│
├── Chatbot/              # 💬 React frontend chatbot interface
│   ├── src/
│   ├── package.json
│   └── ... (Chat.jsx, Voice.jsx, API integration)
│
├── frontend/             # 🌐 Dummy landing site deployed at:
│                         # 👉 http://cosmo-pi-three.vercel.app/
│
├── Conda/                # ⚙️ CUDA setup files and environment for Whisper (STT)
│   └── (Set up for CUDA 12, cuDNN, faster-whisper, etc.)

```

---

## 🚀 Setup & Run Instructions

### 1. 🔧 Backend (FastAPI + LangGraph + Whisper)

### Step 1: Create Environment

```bash
bash
CopyEdit
conda create -p venv python=3.10
conda activate ./venv

```

### Step 2: Install Backend Requirements

```bash
bash
CopyEdit
pip install -r app/requirements.txt

```

Or install directly if `requirements.txt` is missing:

```bash
bash
CopyEdit
pip install fastapi uvicorn[standard] faster-whisper soundfile numpy webrtcvad

```

### Step 3: Start FastAPI Server

```bash
bash
CopyEdit
cd app
uvicorn app:app --port 8000 --reload

```

---

### 2. 💬 Chatbot Frontend (React)

### Step 1: Navigate to Chatbot folder

```bash
bash
CopyEdit
cd Chatbot

```

### Step 2: Install Node dependencies

```bash
bash
CopyEdit
npm install
npm install react-icons react-router-dom axios framer-motion dompurify

```

### Step 3: Start Frontend

```bash
bash
CopyEdit
npm start

```

---

### 3. 🎤 Whisper Voice Mode Setup

### Step 1: Follow [faster-whisper installation guide](https://github.com/guillaumekln/faster-whisper)

- Ensure CUDA 12.x and cuDNN are installed correctly
- GPU support requires `torch` with CUDA (check with `torch.cuda.is_available()`)

### Step 2: Install required Python packages

```bash
bash
CopyEdit
pip install fastapi uvicorn[standard] faster-whisper soundfile numpy webrtcvad

```

### Step 3: Voice mode runs automatically via WebSocket route `/voice` using real-time transcription.

---

## ✅ Live Demo

- 🌐 Frontend (Landing): [http://cosmo-pi-three.vercel.app/](http://cosmo-pi-three.vercel.app/)
- 🔌 Backend: FastAPI running locally at `http://localhost:8000`
- 💬 Chatbot: Access via local React client in `Chatbot` folder

---

## 💡 Features

- 🔐 Login & role-based access: Student, Staff, Admin
- 🤖 Chatbot with LangGraph (LLM)
- 🧠 Natural language query handling for:
    - Timetable, attendance, results, profile
- 🎤 Real-time voice input via Faster-Whisper + WebRTC VAD
- 💬 Beautiful chat UI with framer-motion animations
# AI HelpDesk Bot

### 📌 Overview

The **AI Student HelpDesk Bot** is a role-based, intelligent assistant designed to support students and staff at a university. It features a conversational interface (chat and voice), real-time LLM-based interaction, database tools, document understanding, and role-based actions. The system has two main components:

- **Frontend (React.js)**
- **Backend (FastAPI + LangGraph + LangChain + Whisper)**

![Flow Chart (Copy).png](Flow_Chart_(Copy).png)

## 🔧 Frontend (React.js)

### Features:

- **Chat Interface** with:
    - Role-based views (Guest / Student / Staff)
    - Realtime messaging
    - Collapsible sidebar for mode toggle
- **Voice Mode**
    - Microphone access
    - Streams audio to backend via WebSocket
    - Displays transcribed and bot response text
- **Authentication**
    - Login & Register
    - Session-based storage

## 🔩 Backend (FastAPI)

### Core Components:

### 1. **LangGraph Flow**

**Start Node: `AUTH NODE`**

- Verifies if JWT/session token exists.
- If not logged in → activates **Guest Mode**.

**Guest Mode**

- Handles queries like:
    - Admission Process
    - Course Details
    - Fee Structure
- Powered by **RAG** (Retrieval-Augmented Generation):
    - Vector store of college documents (PDFs, websites)
    - Uses LangChain retriever tools

**If Logged In → Check Role**

- `role == student` → enter Student Mode
- `role == staff` → enter Staff Mode

### 2. **Student Mode Tools**

| Tool | Description |
| --- | --- |
| `get_attendance()` | Fetches subject-wise attendance |
| `get_timetable()` | Shows daily/weekly schedule |
| `get_notices()` | Lists official notices |
| `get_result()` | Returns semester result summary |

### 3. **Staff Mode Tools**

| Tool | Description |
| --- | --- |
| `mark_attendance(section, subject)` | Mark attendance for a class |
| `post_notice()` | Add/update college notices |
| `add_schedule()` | Add class schedules |
| `update_result()` | Update marks for students |

---

## 📄 Document Parser

**Function**: Accepts documents (PDFs, DOCX, etc.), converts into:

- Clean **text**
- Structured **JSON** format

Used for:

- Admission brochures
- Academic policies
- Course structure

## 🎙 Voice Mode

### Real-Time Streaming Pipeline:

1. **Frontend**
    - Microphone stream sent via WebSocket to FastAPI.
2. **Backend**
    - Uses **Faster Whisper** on CUDA (GPU)
    - Transcribes speech in real-time
3. **Pass to LangGraph**
    - Transcribed text passed to appropriate node/tool
4. **TTS (Text-to-Speech)**
    - Uses **Windows built-in TTS system**
    - Response streamed back as audio

## 📦 Technologies Used

| Layer | Tech Stack |
| --- | --- |
| Frontend | React.js, Tailwind CSS, Axios, WebSockets, Framer Motion |
| Backend | FastAPI, LangGraph, LangChain, SQLite/PostgreSQL |
| LLM & Tools | Groq (LLaMA3), LangGraph nodes, RAG tools |
| Voice | Faster-Whisper (STT), Windows TTS (speech synthesis) |
| Auth | JWT / Supabase Auth |
| Vector DB | FAISS (for college documents |

## 🧠 Summary of System Flow

1. **Guest Users** → College info via RAG.
2. **Logged-In Students** → LLM tools like timetable, results.
3. **Logged-In Staff** → LLM tools to manage student data.
4. **Voice Mode** → Real-time interaction powered by Whisper + TTS.
5. **Document Upload** → Separate FastAPI route to extract structured knowledge.
