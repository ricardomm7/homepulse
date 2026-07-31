from fastapi import FastAPI
import psutil

app = FastAPI(title="HomePulse API", description="API de monitorização do servidor")

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "cpu_percent": psutil.cpu_percent(),
        "memory_percent": psutil.virtual_memory().percent
    }
