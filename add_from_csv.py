import csv
import re
import os

csv_file = '/Users/eshtiaqahmad/Downloads/shipwrecks_1901_2026_exact_coordinates.csv'
html_file = '/Users/eshtiaqahmad/Downloads/ship wrech /index.html'

def parse_coords(c_str):
    if not c_str: return None, None
    c_str = c_str.upper()
    
    m = re.search(r'([\d\.]+)\s*°?\s*([NS])\s*[,; ]*\s*([\d\.]+)\s*°?\s*([EW])', c_str)
    if m:
        lat = float(m.group(1))
        if m.group(2) == 'S': lat = -lat
        lon = float(m.group(3))
        if m.group(4) == 'W': lon = -lon
        return lat, lon
        
    return None, None

def clean_text(text):
    if not text: return ""
    text = re.sub(r'\.mw-parser-output[^}]*\}', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.replace('"', '\\"').strip()

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
added_count = 0

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name = clean_text(row.get('wreck_date', ''))
        if not name or name.lower() == 'ship': continue
        
        c_str = row.get('coordinates', '')
        lat, lon = parse_coords(c_str)
        if lat is None or lon is None: continue
        
        date = clean_text(row.get('year_list', 'Unknown'))
        
        desc = clean_text(row.get('details', ''))
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

print(f"Added {added_count} new incidents from the CSV file.")
