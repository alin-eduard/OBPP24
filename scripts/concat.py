#!/usr/bin/env python3
import sys
import os
import re
from PyPDF2 import PdfMerger

def extract_leading_number(filename: str) -> int:
    """Extract the leading number from filenames like '9. Title.pdf'."""
    match = re.match(r"^\s*(\d+)", filename)
    return int(match.group(1)) if match else float('inf')

def concat_pdfs(input_dir: str, output_dir: str, output_file: str):
    if not os.path.isdir(input_dir):
        print(f"Error: input directory '{input_dir}' not found.")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    pdf_files = [f for f in os.listdir(input_dir) if f.lower().endswith(".pdf")]
    pdf_files.sort(key=extract_leading_number)  # ✅ Sort by the numeric prefix

    if not pdf_files:
        print("No PDF files found in input directory.")
        sys.exit(1)

    merger = PdfMerger()

    try:
        for pdf in pdf_files:
            path = os.path.join(input_dir, pdf)
            print(f"Adding: {path}")
            merger.append(path)

        output_path = os.path.join(output_dir, output_file)
        merger.write(output_path)
        merger.close()
        print(f"✅ PDF successfully created: {output_path}")

    except Exception as e:
        print(f"Error during merge: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python concat_pdfs.py <input_dir> <output_dir> <output_file>")
        sys.exit(1)

    input_dir = sys.argv[1]
    output_dir = sys.argv[2]
    output_file = sys.argv[3]

    concat_pdfs(input_dir, output_dir, output_file)
