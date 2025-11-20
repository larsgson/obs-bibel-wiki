#!/usr/bin/env python3
import csv
import json
import re

def convert_csv_to_hierarchical_json(csv_file_path, json_file_path):
    """
    Convert CSV to hierarchical JSON structure.
    - Top level: Column A (Scripture Set titles)
    - Next level: Column B (subcategories when present)
    - Last level: Column C + Column D (scripture reference + description)
    """

    result = {}
    current_main_category = None
    current_subcategory = None

    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        # Use csv.reader to handle proper CSV parsing
        reader = csv.reader(csvfile, delimiter='\t')

        for row in reader:
            # Pad row to ensure we have at least 4 columns
            while len(row) < 4:
                row.append('')

            col_a, col_b, col_c, col_d = row[0], row[1], row[2], row[3]

            # Skip empty rows
            if not any([col_a.strip(), col_b.strip(), col_c.strip(), col_d.strip()]):
                continue

            # Column A has content - this is a main category
            if col_a.strip():
                current_main_category = col_a.strip()
                current_subcategory = None
                if current_main_category not in result:
                    result[current_main_category] = {}

            # Column B has content (and A is empty) - this is a subcategory
            elif col_b.strip() and not col_c.strip():
                current_subcategory = col_b.strip()
                if current_main_category:
                    if current_subcategory not in result[current_main_category]:
                        result[current_main_category][current_subcategory] = []

            # Column C has content - this is a scripture entry
            elif col_c.strip():
                scripture_ref = col_c.strip()
                description = col_d.strip() if col_d.strip() else ""

                # Clean up description (remove leading/trailing quotes and spaces)
                description = re.sub(r'^[\s"]+|[\s"]+$', '', description)

                entry = {
                    "reference": scripture_ref,
                    "description": description
                }

                if current_main_category:
                    # If we have a subcategory, add to subcategory
                    if current_subcategory:
                        if current_subcategory not in result[current_main_category]:
                            result[current_main_category][current_subcategory] = []
                        result[current_main_category][current_subcategory].append(entry)
                    else:
                        # No subcategory, add directly to main category
                        if 'entries' not in result[current_main_category]:
                            result[current_main_category]['entries'] = []
                        result[current_main_category]['entries'].append(entry)

    # Write to JSON file
    with open(json_file_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(result, jsonfile, indent=2, ensure_ascii=False)

    return result

def main():
    csv_file = 'ScriptureSetsESP300Kingdom.csv'
    json_file = 'ScriptureSetsESP300Kingdom.json'

    print(f"Converting {csv_file} to {json_file}...")

    try:
        result = convert_csv_to_hierarchical_json(csv_file, json_file)
        print(f"Successfully converted to {json_file}")
        print(f"Found {len(result)} main categories:")
        for category in result.keys():
            print(f"  - {category}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
