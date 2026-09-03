import json

with open('src/lib/jkCatalog.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total categories in jkCatalog.json: {len(data)}")
for i, cat in enumerate(data):
    items = cat.get('items', [])
    sr_nos = [str(item.get('catalogSrNo', '')) + (f".{item.get('variantSrNo')}" if item.get('variantSrNo') else '') for item in items]
    first_3 = ", ".join(sr_nos[:3])
    last_3 = ", ".join(sr_nos[-3:])
    print(f"{i+1}. Category: \"{cat.get('name')}\" | Parent: \"{cat.get('parentId')}\" | Page: {cat.get('sourcePage')} | Items: {len(items)} | SrNos: [{first_3} ... {last_3}]")
