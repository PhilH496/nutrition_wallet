# Nutrition Wallet

This repository contains a Next.js frontend and a FastAPI backend. The instructions below show how to set up both projects locally on Windows PowerShell. 

Prerequisites
- Node.js and your package manager of choice (npm comes with Node)
- Python 3.10+ 
- Git

Frontend (Next.js)

Windows Powershell:

1. Open a PowerShell terminal and go to the frontend folder:

   cd frontend

2. Install dependencies:

   npm install

3. Run the dev server:

   npm run dev

Backend (FastAPI)

Windows PowerShell:

1. Open a PowerShell terminal and go to the backend folder:

   cd backend

2. Create a virtual environment and activate it:

   python -m venv .venv 
   .\.venv\Scripts\Activate.ps1

3. Install dependencies:

   pip install fastapi uvicorn[standard]

4. Run the development server:

   uvicorn app.main:app --reload --port 8000
