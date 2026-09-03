import pypdf

reader = pypdf.PdfReader('JK-Spares_Pricelist_2023_FINAL1.pdf')
print(f"Total Pages: {len(reader.pages)}")

for i in range(min(15, len(reader.pages))):
    text = reader.pages[i].extract_text()
    first_lines = "\n".join([line.strip() for line in text.split("\n") if line.strip()][:5])
    print(f"\n--- PAGE {i+1} ---")
    print(first_lines)
