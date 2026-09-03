import json

with open('src/lib/jkCatalog.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for cat in data:
    if 'Impeller' in cat.get('name'):
        print(f"\n--- Category: {cat.get('name')} ---")
        for item in cat.get('items', []):
            print(f"Sr: {item.get('catalogSrNo')}, Name: {item.get('name')}, Price: {item.get('costPrice')}")
