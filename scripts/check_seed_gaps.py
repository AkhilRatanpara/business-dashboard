import re

with open('scripts/seed_full_catalog_2023.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Find all addItem lines
# addItem('category', 'srNo', 'name', price)
matches = re.findall(r"addItem\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]", text)

cat_items = {}
for cat, sr, name in matches:
    if cat not in cat_items:
        cat_items[cat] = []
    cat_items[cat].append((sr, name))

print("=== CHECKING ALL CATEGORIES IN seed_full_catalog_2023.ts ===")
for cat, items in cat_items.items():
    for i in range(len(items) - 1):
        sr1 = items[i][0]
        sr2 = items[i+1][0]
        if sr1 == '20' and sr2 == '23':
            print(f"FOUND EXACT 20 -> 23 in '{cat}': {items[i][1]} -> {items[i+1][1]}")
        try:
            v1 = float(sr1)
            v2 = float(sr2)
            if v2 - v1 > 1.5 and '.' not in sr1 and '.' not in sr2:
                print(f"Gap in '{cat}': {sr1} -> {sr2} ({items[i][1]} -> {items[i+1][1]})")
        except:
            pass
