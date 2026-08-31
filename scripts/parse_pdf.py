import pypdf
import json

reader = pypdf.PdfReader('JK-Spares_Pricelist_2023_FINAL1.pdf')
print(f"Total pages in PDF: {len(reader.pages)}")

all_text = []
for i, page in enumerate(reader.pages):
    text = page.extract_text()
    print(f"\n--- PAGE {i+1} ---")
    print(text[:400] if len(text) > 400 else text)
    all_text.append({"page": i+1, "text": text})

with open('scripts/pdf_dump.json', 'w', encoding='utf-8') as f:
    json.dump(all_text, f, indent=2, ensure_ascii=False)

print("\nDumped all text to scripts/pdf_dump.json")
