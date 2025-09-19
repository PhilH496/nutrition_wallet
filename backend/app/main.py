from fastapi import FastAPI

app = FastAPI(title="Nutrition Wallet Backend")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Nutrition Wallet Backend is running"}
