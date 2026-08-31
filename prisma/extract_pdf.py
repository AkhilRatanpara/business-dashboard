import pypdf
import os

os.makedirs('extracted_pages', exist_ok=True)
reader = pypdf.PdfReader('JK-Spares_Pricelist_2023_FINAL1.pdf')
print(f'Total pages in PDF: {len(reader.pages)}')

for page_idx, page in enumerate(reader.pages):
    for img_idx, img_file in enumerate(page.images):
        img_path = f'extracted_pages/page_{page_idx+1}_{img_idx+1}_{img_file.name}'
        with open(img_path, 'wb') as f:
            f.write(img_file.data)
        print(f'Saved: {img_path}')
