import pdfplumber
import re
import os

pdf_files = [
    '/Users/eshtiaqahmad/Downloads/shipwrecks_1901_to_1975_collected.pdf',
    '/Users/eshtiaqahmad/Downloads/shipwrecks_1976_to_2026_collected.pdf'
]
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

incident_lines = lines[start_idx+1:end_idx]

existing_incidents = {}
for i, line in enumerate(incident_lines):
    m = re.search(r'name:\s*"([^"]+)"', line)
    if m:
        name = m.group(1).lower().strip()
        existing_incidents[name] = i

new_incidents = []
added_count = 0

for pdf_file in pdf_files:
    if not os.path.exists(pdf_file): continue
    print(f"Scanning {pdf_file}...")
    with pdfplumber.open(pdf_file) as pdf:
        for page in pdf.pages:
            table = page.extract_table()
            if not table: continue
            headers = [h.replace('\n', ' ').strip().lower() if h else '' for h in table[0]]
            
            if 'ship' not in headers and 'ship / vessel' not in headers:
                continue
                
            coord_header = next((h for h in headers if 'coord' in h), None)
            if not coord_header:
                continue
                
            ship_idx = headers.index('ship') if 'ship' in headers else headers.index('ship / vessel')
            coord_idx = headers.index(coord_header)
            
            date_idx = headers.index('date') if 'date' in headers else (headers.index('sunk date') if 'sunk date' in headers else None)
            notes_idx = headers.index('notes') if 'notes' in headers else (headers.index('details') if 'details' in headers else (headers.index('description') if 'description' in headers else None))
            
            for row in table[1:]:
                if not row or len(row) <= max(ship_idx, coord_idx) or not row[ship_idx] or not row[coord_idx]: continue
                
                name = clean_text(row[ship_idx])
                if not name or name.lower() in ('ship', 'ship / vessel', '-'): continue
                
                lat, lon = parse_coords(row[coord_idx])
                if lat is None or lon is None: continue
                
                date = "Unknown"
                if date_idx is not None and len(row) > date_idx and row[date_idx]:
                    date = clean_text(row[date_idx])
                    
                desc = ""
                if notes_idx is not None and len(row) > notes_idx and row[notes_idx]:
                    desc = clean_text(row[notes_idx])
                
                sea = "international waters"
                if len(desc) > 300: desc = desc[:297] + "..."
                
                formatted_line = f'        {{ name: "{name}", date: "{date}", lat: {lat:.4f}, lon: {lon:.4f}, cls: "cargo", deaths: "Unknown", sea: "{sea}", precision: "exact", desc: "{desc}", src: [] }},\n'
                
                name_key = name.lower()
                if name_key not in existing_incidents:
                    new_incidents.append(formatted_line)
                    added_count += 1
                    existing_incidents[name_key] = -1 

new_html = lines[:start_idx+1] + incident_lines + new_incidents + lines[end_idx:]

with open(html_file, 'w', encoding='utf-8') as f:
    f.writelines(new_html)

print(f"Added {added_count} new incidents with coordinates from the two chronological PDFs.")
