from fastapi import FastAPI

app = FastAPI(
    title="TeioOS Exam Server",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "message": "Welcome to TeioOS Exam Server"
    }