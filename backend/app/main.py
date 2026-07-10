from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

from database import engine, Base, get_db
import models
from services.parser import load_excel
from services.dashboard import (
    generate_kpis,
    generate_charts,
    generate_objectives
)

# Création automatique des tables au démarrage
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Industrial Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


def sanitize_dataframe_for_json(df: pd.DataFrame) -> list[dict]:
    """
    Nettoie un DataFrame Pandas pour le rendre sérialisable en JSON :
    - Convertit les Timestamps / Datetime en YYYY-MM-DD
    - Remplace NaN, NaT, +inf et -inf par None
    """
    df_clean = df.copy()

    for col in df_clean.select_dtypes(include=['datetime', 'datetime64', 'datetimetz']).columns:
        df_clean[col] = df_clean[col].dt.strftime('%Y-%m-%d')

    df_clean = df_clean.replace({np.nan: None, np.inf: None, -np.inf: None})

    return df_clean.to_dict(orient="records")


@app.get("/")
def root():
    return {"message": "API Industrial Dashboard OK"}


# 1. ANALYSER ET ENREGISTRER UN FICHIER DANS POSTGRESQL
@app.post("/analyze")
async def analyze(file: UploadFile = File(...), db: Session = Depends(get_db)):
    sheets_data = load_excel(file.file)
    
    db_file = models.ImportedFile(filename=file.filename)
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    response = {}

    for sheet_name, df in sheets_data.items():
        records = sanitize_dataframe_for_json(df)

        sheet_record = models.FileSheetData(
            file_id=db_file.id,
            sheet_name=sheet_name,
            data_json=records
        )
        db.add(sheet_record)

        response[sheet_name] = {
            "columns": df.columns.tolist(),
            "kpis": generate_kpis(df),
            "charts": generate_charts(df),
            "objectives": generate_objectives(df)
        }

    db.commit()
    
    return {
        "file_id": db_file.id,
        "filename": db_file.filename,
        "sheets": response
    }


# 2. OBTENIR TOUS LES FICHIERS IMPORTÉS
@app.get("/files")
def get_all_files(db: Session = Depends(get_db)):
    files = db.query(models.ImportedFile).order_by(models.ImportedFile.imported_at.desc()).all()
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "imported_at": f.imported_at.strftime("%Y-%m-%d %H:%M:%S"),
            "sheets_count": len(f.file_sheets)
        } for f in files
    ]


# 3. CHARGER LE DASHBOARD D'UN FICHIER EXISTANT
@app.get("/files/{file_id}/dashboard")
def get_file_dashboard(file_id: int, db: Session = Depends(get_db)):
    db_file = db.query(models.ImportedFile).filter(models.ImportedFile.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    response = {}
    
    for sheet_entry in db_file.file_sheets:
        raw_data = sheet_entry.data_json or []
        df = pd.DataFrame(raw_data)

        if not df.empty:
            df = df.replace({np.nan: None})

        response[sheet_entry.sheet_name] = {
            "columns": df.columns.tolist() if not df.empty else [],
            "kpis": generate_kpis(df) if not df.empty else {},
            "charts": generate_charts(df) if not df.empty else [],
            "objectives": generate_objectives(df) if not df.empty else {}
        }

    return {
        "file_id": db_file.id,
        "filename": db_file.filename,
        "imported_at": db_file.imported_at.strftime("%Y-%m-%d %H:%M:%S"),
        "sheets": response
    }