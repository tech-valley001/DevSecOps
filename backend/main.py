from __future__ import annotations

from typing import Any, Dict, List
from fastapi.responses import HTMLResponse

import numpy as np
import pandas as pd
from fastapi import (
    Body,
    Depends,
    FastAPI,
    File,
    HTTPException,
    Request,
    Response,
    UploadFile,
    status,
    APIRouter,
    Header,
)
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import Session

from database import Base, engine, get_db
import models
from models import ImportedFile
from services.dashboard import (
    generate_charts,
    generate_kpis,
    generate_objectives,
)
from services.parser import load_excel

# ---------------------------------------------------------
# 1. Initialisation de l'Application FastAPI
# ---------------------------------------------------------
app = FastAPI(title="Industrial Dashboard API")




api_router=APIRouter(prefix="/api")

app.include_router(api_router)
# ---------------------------------------------------------
# 2. Modèle SQLAlchemy pour la Gestion des Utilisateurs
# ---------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)


# Création automatique de toutes les tables dans la base de données
Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------
# 3. Utilitaire de Hachage des Mots de Passe
# ---------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------
# 4. Schémas Pydantic (Validation des données de requête)
# ---------------------------------------------------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ---------------------------------------------------------
# 5. Utilitaires Internes
# ---------------------------------------------------------
def sanitize_dataframe_for_json(df: pd.DataFrame) -> list[dict]:
    """Nettoie un DataFrame Pandas pour le rendre sérialisable en JSON."""
    df_clean = df.copy()

    for col in df_clean.select_dtypes(
        include=["datetime", "datetime64", "datetimetz"]
    ).columns:
        df_clean[col] = df_clean[col].dt.strftime("%Y-%m-%d")

    df_clean = df_clean.replace({np.nan: None, np.inf: None, -np.inf: None})

    return df_clean.to_dict(orient="records")


# ---------------------------------------------------------
# 6. Endpoints de Gestion de Fichiers & Dashboard
# ---------------------------------------------------------
@api_router.get("/")
def root():
    return {"message": "API Industrial Dashboard OK"}


@api_router.post("/analyze")
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
            file_id=db_file.id, sheet_name=sheet_name, data_json=records
        )
        db.add(sheet_record)

        response[sheet_name] = {
            "columns": df.columns.tolist(),
            "kpis": generate_kpis(df),
            "charts": generate_charts(df),
            "objectives": generate_objectives(df),
        }

    db.commit()

    return {
        "file_id": db_file.id,
        "filename": db_file.filename,
        "sheets": response,
    }


@api_router.get("/files")
def get_all_files(db: Session = Depends(get_db)):
    files = (
        db.query(models.ImportedFile)
        .order_by(models.ImportedFile.imported_at.desc())
        .all()
    )
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "imported_at": f.imported_at.strftime("%Y-%m-%d %H:%M:%S"),
            "sheets_count": len(f.file_sheets),
        }
        for f in files
    ]


@api_router.get("/files/{file_id}/dashboard")
def get_file_dashboard(file_id: int, db: Session = Depends(get_db)):
    db_file = (
        db.query(models.ImportedFile)
        .filter(models.ImportedFile.id == file_id)
        .first()
    )
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
            "objectives": generate_objectives(df) if not df.empty else {},
        }

    return {
        "file_id": db_file.id,
        "filename": db_file.filename,
        "imported_at": db_file.imported_at.strftime("%Y-%m-%d %H:%M:%S"),
        "sheets": response,
    }


@api_router.delete("/files/delete-all")
def delete_all_files(db: Session = Depends(get_db)):
    """Supprime tous les fichiers de la BDD."""
    all_files = db.query(ImportedFile).all()
    count = len(all_files)
    for file in all_files:
        db.delete(file)
    db.commit()
    return {"message": f"Tous les fichiers ({count}) ont été supprimés avec succès"}


@api_router.post("/files/delete-multiple")
def delete_multiple_files(
    payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)
):
    """Supprime une sélection de fichiers par leurs IDs."""
    ids = payload.get("ids", [])

    if not ids:
        raise HTTPException(status_code=400, detail="Aucun ID valide fourni")

    try:
        clean_ids = [int(x) for x in ids]
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Les IDs doivent être des entiers"
        )

    files_to_delete = (
        db.query(ImportedFile).filter(ImportedFile.id.in_(clean_ids)).all()
    )

    for file in files_to_delete:
        db.delete(file)

    db.commit()
    return {"message": f"{len(files_to_delete)} fichier(s) supprimé(s) avec succès"}


@api_router.delete("/files/{file_id}")
def delete_single_file(file_id: int, db: Session = Depends(get_db)):
    """Supprime un seul fichier par ID."""
    file_item = (
        db.query(ImportedFile).filter(ImportedFile.id == file_id).first()
    )
    if not file_item:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    db.delete(file_item)
    db.commit()
    return {"message": f"Fichier {file_id} supprimé avec succès"}


# ---------------------------------------------------------
# 7. Endpoints d'Authentification
# ---------------------------------------------------------
@api_router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User).filter(User.email == user_data.email).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=400, detail="Cet email est déjà utilisé"
        )

    new_user = User(
        email=user_data.email, hashed_password=hash_password(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Utilisateur créé avec succès", "email": new_user.email}


@api_router.post("/login")
def login(
    credentials: UserLogin, response: Response, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(
        credentials.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=400, detail="Email ou mot de passe incorrect"
        )

    response.set_cookie(
        key="user_email",
        value=user.email,
        httponly=True,
        samesite="lax",
        max_age=3600,
    )
    return {"message": "Connexion réussie"}


@api_router.get("/me")
def get_me(request: Request):
    user_email = request.cookies.get("user_email")
    if not user_email:
        raise HTTPException(status_code=401, detail="Non authentifié")
    return {"email": user_email}


@api_router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="user_email")
    return {"message": "Déconnexion réussie"}


@app.get("/my-account", response_class=HTMLResponse)
def my_account(
    x_forwarded_host: str | None = Header(default=None)
):
    host = x_forwarded_host or "localhost"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>My Account</title>
    </head>
    <body>
        <h1>My Account</h1>

        <p>Bienvenue dans votre compte.</p>

        <p>
            Host utilisé par le serveur :
            {host}
        </p>

    </body>
    </html>
    """