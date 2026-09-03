import re

with open('scripts/seed_full_catalog_2023.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

current_cat = None
items_by_cat = {}

# Check for sr patterns like sr: '20', sr: '23' or addItem('cat', 'sr'
for line in lines:
    m_call = re.search(r"addItem\(['\"]([^'\"]+)['\"],\s*['\"]([^'\"]+)['\"],\s*['\"]([^'\"]+)['\"]", line)
    if m_call:
        cat, sr, name = m_call.groups()
        items_by_cat.setdefault(cat, []).append((sr, name))
        continue
    
    m_array = re.search(r"\{\s*sr:\s*['\"]([^'\"]+)['\"],\s*name:\s*['\"]([^'\"]+)['\"]", line)
    if m_array:
        sr, name = m_array.groups()
        # Find which category this array is for by checking context or previous lines
        items_by_cat.setdefault("array_items", []).append((sr, name))

print("Searching for 20 -> 23...")
for cat, items in items_by_cat.items():
    for i in range(len(items) - 1):
        sr1 = items[i][0]
        sr2 = items[i+1][0]
        if sr1 == '20' and sr2 == '23':
            print(f"FOUND 20 -> 23 in {cat}: {items[i][1]} -> {items[i+1][1]}")
        try:
            v1 = float(sr1)
            v2 = float(sr2)
            if v2 - v1 > 1.5 and '.' not in sr1 and '.' not in sr2:
                print(f"Gap in {cat}: Sr {sr1} -> Sr {sr2} ({items[i][1]} -> {items[i+1][1]})")
        except:
            pass
