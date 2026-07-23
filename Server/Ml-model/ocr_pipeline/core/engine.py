import os
import sys
import io
import pytesseract
from PIL import Image, ImageEnhance
from ocr_pipeline.core.registry import ParserRegistry
import ocr_pipeline.parsers  # Ensures plugins are registered
from ocr_pipeline.models.bill_schema import ExtractedBill

tesseract_cmd_paths = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
]
for t_path in tesseract_cmd_paths:
    if os.path.exists(t_path):
        pytesseract.pytesseract.tesseract_cmd = t_path
        break

class PipelineEngine:
    """
    Central Coordinator for Document Extraction Pipeline.
    """

    @staticmethod
    def translate_marathi_digits(text: str) -> str:
        text = text.replace('\u200d', '').replace('\u200c', '')
        marathi_to_english = {
            '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
            '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
        }
        for mar_char, eng_char in marathi_to_english.items():
            text = text.replace(mar_char, eng_char)
        return text

    @classmethod
    def process_file_bytes(cls, file_bytes: bytes, filename: str) -> ExtractedBill:
        filename_lower = filename.lower()
        pages = []
        text = ""

        if filename_lower.endswith(".pdf"):
            try:
                from pdf2image import convert_from_bytes
                poppler_paths = [
                    r"C:\Program Files\poppler\bin",
                    r"C:\poppler\bin",
                    os.path.join(os.path.dirname(__file__), "..", "poppler", "bin"),
                ]
                winget_packages_dir = os.path.expandvars(r"%USERPROFILE%\AppData\Local\Microsoft\WinGet\Packages")
                if os.path.exists(winget_packages_dir):
                    for folder in os.listdir(winget_packages_dir):
                        if "poppler" in folder.lower():
                            target_path = os.path.join(winget_packages_dir, folder)
                            for root, dirs, files in os.walk(target_path):
                                if "pdftoppm.exe" in files:
                                    poppler_paths.append(root)
                                    break
                poppler_bin = None
                for p in poppler_paths:
                    if os.path.exists(p):
                        poppler_bin = p
                        break

                if poppler_bin:
                    pages = convert_from_bytes(file_bytes, dpi=300, poppler_path=poppler_bin)
                else:
                    pages = convert_from_bytes(file_bytes, dpi=300)
            except Exception:
                try:
                    import fitz
                    doc = fitz.open(stream=file_bytes, filetype="pdf")
                    pages = []
                    for page in doc:
                        pix = page.get_pixmap(dpi=300)
                        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                        pages.append(img)
                except Exception:
                    import pypdfium2 as pdfium
                    pdf = pdfium.PdfDocument(file_bytes)
                    pages = [page.render(scale=4.166666).to_pil() for page in pdf]

            for page in pages:
                enhancer = ImageEnhance.Contrast(page)
                img_enhanced = enhancer.enhance(1.8)
                text += pytesseract.image_to_string(img_enhanced, lang="eng+mar") + "\n"
        else:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            w, h = img.size
            if w < 1200:
                scale = 1200 / w
                img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
            enhancer = ImageEnhance.Contrast(img)
            img_enhanced = enhancer.enhance(1.8)
            text = pytesseract.image_to_string(img_enhanced, lang="eng+mar")
            pages = [img]

        text = cls.translate_marathi_digits(text)
        parser = ParserRegistry.get_parser(text)
        print(f"[PIPELINE ENGINE] Selected provider parser plugin: '{parser.provider_key}' for document '{filename}'")

        extracted_bill = parser.parse(text, pages_images=pages)
        return extracted_bill
