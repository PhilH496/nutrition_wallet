from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth

app = FastAPI()

# CORS
#Info: "https://yourapp.vercel.app" - our deployed frontend URL for PRODUCTION; right now only LOCAL dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Nutrition Wallet API"}