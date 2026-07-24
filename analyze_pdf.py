import pdfplumber

with pdfplumber.open('/Users/eshtiaqahmad/Downloads/shipwrecks_1901_to_1975_collected.pdf') as pdf:
    for page_num in range(2, 6):
        page = pdf.pages[page_num]
        table = page.extract_table()
        if table:
            print(f"--- Page {page_num} ---")
            for row in table[:10]:
                print(row)
