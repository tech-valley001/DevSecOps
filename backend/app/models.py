from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ImportedFile(Base):
    __tablename__ = "imported_files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    imported_at = Column(DateTime, default=datetime.now)

    # Relation avec les données contenues dans le fichier
    file_sheets = relationship("FileSheetData", back_populates="file", cascade="all, delete-orphan")

class FileSheetData(Base):
    __tablename__ = "file_sheet_data"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("imported_files.id"), nullable=False)
    sheet_name = Column(String, nullable=False)
    data_json = Column(JSON, nullable=False)  # Enregistre le contenu nettoyé du DataFrame

    file = relationship("ImportedFile", back_populates="file_sheets")