import pdfplumber
import re
import os

pdf_file = '/Users/eshtiaqahmad/Downloads/international_shipwrecks_catalogue.pdf'
html_file = '/Users/eshtiaqahmad/Downloads/ship wrech /index.html'

def parse_coords(c_str):
    if not c_str: return None, None
    c_str = c_str.replace('\n', ' ').strip()
    m = re.search(r'([-\d\.]+)\s*,\s*([-\d\.]+)', c_str)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None

def clean_text(text):
    if not text: return ""
    return text.replace('\n', ' ').replace('"', '\\"').strip()

with open(html_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.strip().startswith('const INCIDENTS = ['):
        start_idx = i
    if start_idx != -1 and line.strip() == '];' and 'ALL_INCIDENTS' in "".join(lines[i:i+5]):
        end_idx = i
        break

if start_idx == -1 or end_idx == -1:
    print("Could not find INCIDENTS array bounds.")
    exit(1)

incident_lines = lines[start_idx+1:end_idx]

existing_incidents = {}
for i, line in enumerate(incident_lines):
    m = re.search(r'name:\s*"([^"]+)"', line)
    if m:
        name = m.group(1).lower().strip()
        existing_incidents[name] = i

new_incidents = []
updated_count = 0
added_count = 0

with pdfplumber.open(pdf_file) as pdf:
    for page in pdf.pages:
        table = page.extract_table()
        if not table: continue
        headers = [h.replace('\n', ' ').strip().lower() if h else '' for h in table[0]]
        
        if 'ship' not in headers or 'coordinates (decimal)' not in headers:
            continue
            
        ship_idx = headers.index('ship')
        date_idx = headers.index('sunk date')
        coord_idx = headers.index('coordinates (decimal)')
        notes_idx = headers.index('notes')
        sea_idx = headers.index('subregion')
        
        for row in table[1:]:
            if not row or not row[ship_idx] or not row[coord_idx]: continue
            
            name = clean_text(row[ship_idx])
            if not name or name.lower() == 'ship' or name == '-': continue
            
            lat, lon = parse_coords(row[coord_idx])
            if lat is None or lon is None: continue
            
            date = clean_text(row[date_idx]) if row[date_idx] else "Unknown"
            desc = clean_text(row[notes_idx]) if row[notes_idx] else ""
            sea = clean_text(row[sea_idx]) if row[sea_idx] and row[sea_idx] != '-' else "international waters"
            
            if len(desc) > 300: desc = desc[:297] + "..."
            
            formatted_line = f'        {{ name: "{name}", date: "{date}", lat: {lat:.4f}, lon: {lon:.4f}, cls: "cargo", deaths: "Unknown", sea: "{sea}", precision: "exact", desc: "{desc}", src: [] }},\n'
            
            name_key = name.lower()
            if name_key in existing_incidents and existing_incidents[name_key] != -1:
                line_idx = existing_incidents[name_key]
                incident_lines[line_idx] = formatted_line
                updated_count += 1
                existing_incidents[name_key] = -1
            elif name_key not in existing_incidents:
                new_incidents.append(formatted_line)
                added_count += 1
                existing_incidents[name_key] = -1 

new_html = lines[:start_idx+1] + incident_lines + new_incidents + lines[end_idx:]

with open(html_file, 'w', encoding='utf-8') as f:
    f.writelines(new_html)

print(f"Updated {updated_count} existing incidents.")
print(f"Added {added_count} new incidents.")
