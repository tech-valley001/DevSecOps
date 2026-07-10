from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from services.parser import load_excel
from services.dashboard import (
    generate_kpis,
    generate_charts,
    generate_objectives
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return {"message": "API OK"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # load_excel retourne désormais un dictionnaire : { "Grillage": df, "Cobalt": df, ... }
    sheets_data = load_excel(file.file)
    
    response = {}

    for sheet_name, df in sheets_data.items():
        response[sheet_name] = {
            "columns": df.columns.tolist(),
            "kpis": generate_kpis(df),
            "charts": generate_charts(df),
            "objectives": generate_objectives(df)
        }

    return response