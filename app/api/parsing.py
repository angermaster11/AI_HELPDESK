from fastapi import APIRouter, File, UploadFile, HTTPException
from io import BytesIO, StringIO
import fitz  # PyMuPDF
import pandas as pd
import docx
from typing import Dict, List, Any
import logging

router = APIRouter()

# Configure logging
logger = logging.getLogger(__name__)

@router.post("/parse/pdf")
async def parse_pdf(file: UploadFile = File(...)) -> Dict[str, str]:
    try:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="File must be a PDF")
            
        file_content = await file.read()
        doc = fitz.open(stream=file_content, filetype="pdf")
        text = "\n".join([page.get_text() for page in doc])
        return {"content": text}
    except Exception as e:
        logger.error(f"PDF parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

@router.post("/parse/csv")
async def parse_csv(file: UploadFile = File(...)) -> Dict[str, List[Dict[str, Any]]]:
    try:
        if file.content_type not in ["text/csv", "application/vnd.ms-excel"]:
            raise HTTPException(status_code=400, detail="File must be a CSV")
            
        file_content = await file.read()
        csv_string = StringIO(file_content.decode('utf-8'))
        df = pd.read_csv(csv_string)
        return {"content": df.to_dict(orient="records")}
    except Exception as e:
        logger.error(f"CSV parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")

@router.post("/parse/excel")
async def parse_excel(file: UploadFile = File(...)) -> Dict[str, List[Dict[str, Any]]]:
    try:
        if file.content_type not in [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]:
            raise HTTPException(status_code=400, detail="File must be an Excel file")
            
        file_content = await file.read()
        excel_file = pd.ExcelFile(BytesIO(file_content))
        df = excel_file.parse(excel_file.sheet_names[0])
        return {"content": df.to_dict(orient="records")}
    except Exception as e:
        logger.error(f"Excel parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse Excel: {str(e)}")

@router.post("/parse/docx")
async def parse_docx(file: UploadFile = File(...)) -> Dict[str, str]:
    try:
        if (file.content_type != "application/vnd.openxmlformats-officedocument.wordprocessingml.document" and
            not file.filename.endswith('.docx')):
            raise HTTPException(status_code=400, detail="File must be a DOCX")
            
        file_content = await file.read()
        doc = docx.Document(BytesIO(file_content))
        text = "\n".join([para.text for para in doc.paragraphs if para.text])
        return {"content": text}
    except Exception as e:
        logger.error(f"DOCX parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse DOCX: {str(e)}")