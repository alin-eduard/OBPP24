import os
import sys
import json
from PyPDF2 import PdfMerger
import unicodedata

def concat_pdfs(input_dir, output_dir, output_filename, json_path):
    merger = PdfMerger()

    # Citim fișierul JSON cu ordinea dorită
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        ordered_titles = data.get("cantari", [])

    # === FIX START ===
    # Creăm maparea, dar normalizăm cheile la formatul NFC standard.
    # macOS stochează fișierele în NFD (e.g. 'i' + '^'), dar noi vrem să le comparăm cu 'î' (NFC).
    available_pdfs = {}
    for f in os.listdir(input_dir):
        if f.lower().endswith(".pdf"):
            # Extragem numele fără extensie
            raw_app_name = os.path.splitext(f)[0].strip()
            # Normalizăm la NFC (Composition) pentru a garanta potrivirea cu JSON-ul
            normalized_name = unicodedata.normalize('NFC', raw_app_name)
            # Salvăm maparea: Nume Standardizat -> Nume Real de pe disc (pentru a-l putea deschide)
            available_pdfs[normalized_name] = f
    # === FIX END ===

    missing = []  # pentru raportare la final

    # Parcurgem lista din JSON, în ordinea dorită
    for title in ordered_titles:
        # === FIX START ===
        # Normalizăm și titlul căutat tot la NFC
        clean_title = unicodedata.normalize('NFC', title.strip())
        # === FIX END ===

        pdf_name = available_pdfs.get(clean_title)
        
        if pdf_name:
            pdf_path = os.path.join(input_dir, pdf_name)
            print(f"✅ Added: {pdf_name}")
            merger.append(pdf_path)
        else:
            print(f"⚠️ Skipped (missing): {title}")
            missing.append(title)

    # Dacă nu a fost adăugat niciun fișier, ieșim
    if not merger.pages:
        print("❌ No valid PDFs found to merge. Exiting.")
        return

    # Creăm directorul de output dacă nu există
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, output_filename)

    # Scriem rezultatul final
    merger.write(output_path)
    merger.close()

    print(f"\n🎉 PDF created successfully → {output_path}")

    # Raportăm fișierele lipsă, dacă există
    if missing:
        print("\n⚠️ The following files were missing and skipped:")
        for m in missing:
            print(f"   - {m}")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python concat_pdfs.py <input_dir> <output_dir> <output_filename> <json_path>")
        sys.exit(1)

    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    output_filename = sys.argv[3]
    json_path = sys.argv[4]

    concat_pdfs(input_dir, output_dir, output_filename, json_path)