import json

with open('src/lib/jkCatalog.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for cat in data:
    items = cat.get('items', [])
    for i in range(len(items) - 1):
        sr1 = str(items[i].get('catalogSrNo', ''))
        sr2 = str(items[i+1].get('catalogSrNo', ''))
        if sr1 == '20' and sr2 == '23':
            print(f"MATCH: In cat '{cat.get('name')}', {sr1} -> {sr2}: '{items[i].get('name')}' -> '{items[i+1].get('name')}'")
        try:
            val1 = float(sr1)
            val2 = float(sr2)
            if val2 - val1 > 1.5:
                print(f"Gap in '{cat.get('name')}': Sr {sr1} -> Sr {sr2} ({items[i].get('name')} -> {items[i+1].get('name')})")
        except:
            pass
