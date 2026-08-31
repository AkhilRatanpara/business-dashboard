import pypdf

reader = pypdf.PdfReader('JK-Spares_Pricelist_2023_FINAL1.pdf')
for i, page in enumerate(reader.pages):
    print(f"Page {i+1}: images = {len(page.images)}, text_len = {len(page.extract_text().strip())}")
    if len(page.extract_text().strip()) > 0:
        print(f"  sample: {page.extract_text().strip()[:100]}")
