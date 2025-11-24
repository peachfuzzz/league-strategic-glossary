#!/usr/bin/env python3
"""
Import terms from CSV and create markdown files.

Usage: python scripts/import_terms.py <csv_file_path>
"""

import csv
import sys
from pathlib import Path


def parse_list_field(field_value):
    """Parse a comma-separated string into a list, handling empty values."""
    if not field_value or field_value.strip() == "":
        return []
    # Split by comma and strip whitespace from each item
    return [item.strip() for item in field_value.split(",") if item.strip()]


def validate_term(row, row_num):
    """
    Validate that a term has all required fields.
    Returns (is_valid, error_message)
    """
    required_fields = {
        "filename": row.get("filename", "").strip(),
        "id": row.get("id", "").strip(),
        "term": row.get("term", "").strip(),
        "tags": row.get("tags", "").strip(),
        "definition": row.get("definition", "").strip(),
    }

    missing_fields = [field for field, value in required_fields.items() if not value]

    if missing_fields:
        return False, f"Row {row_num}: Missing required fields: {', '.join(missing_fields)}"

    return True, None


def create_markdown_file(row, output_dir):
    """
    Create a markdown file from a CSV row. Overwrites if file exists.
    Returns (success, message)
    """
    filename = row["filename"].strip()
    term_id = row["id"].strip()
    term = row["term"].strip()
    tags = parse_list_field(row.get("tags", ""))
    alternates = parse_list_field(row.get("alternates", ""))
    manual_links = parse_list_field(row.get("manual_links", ""))
    definition = row["definition"].strip()

    # Ensure filename has .md extension
    if not filename.endswith(".md"):
        filename += ".md"

    # Create the file path
    file_path = output_dir / filename

    # Build the markdown content
    frontmatter_lines = ["---", f"id: {term_id}", f"term: {term}"]

    # Add tags
    tags_str = "[" + ", ".join(tags) + "]"
    frontmatter_lines.append(f"tags: {tags_str}")

    # Add alternates if present
    if alternates:
        alternates_str = "[" + ", ".join(alternates) + "]"
        frontmatter_lines.append(f"alternates: {alternates_str}")

    # Add links if present
    if manual_links:
        links_str = "[" + ", ".join(manual_links) + "]"
        frontmatter_lines.append(f"links: {links_str}")

    frontmatter_lines.append("---")

    # Combine frontmatter and definition
    content = "\n".join(frontmatter_lines) + "\n\n" + definition + "\n"

    # Write the file (overwriting if it exists)
    try:
        file_path.write_text(content, encoding="utf-8")
        action = "Overwrote" if file_path.exists() else "Created"
        return True, f"{action}: {filename}"
    except Exception as e:
        return False, f"Error writing {filename}: {str(e)}"


def import_terms(csv_file_path):
    """
    Import terms from CSV file and create markdown files.
    """
    # Determine output directory (relative to project root)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_dir = project_root / "src" / "data" / "terms"

    # Check if output directory exists
    if not output_dir.exists():
        print(f"Error: Output directory does not exist: {output_dir}")
        return

    # Check if CSV file exists
    csv_path = Path(csv_file_path)
    if not csv_path.exists():
        print(f"Error: CSV file not found: {csv_file_path}")
        return

    print(f"Importing terms from: {csv_file_path}")
    print(f"Output directory: {output_dir}")
    print(f"Mode: Overwrite existing files")
    print("-" * 60)

    created_count = 0
    skipped_count = 0
    error_count = 0
    errors = []

    try:
        with open(csv_path, "r", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)

            # Check if required columns exist
            required_columns = ["filename", "id", "term", "tags", "definition", "writing status"]
            missing_columns = [col for col in required_columns if col not in reader.fieldnames]

            if missing_columns:
                print(f"Error: CSV is missing required columns: {', '.join(missing_columns)}")
                print(f"Available columns: {', '.join(reader.fieldnames)}")
                return

            for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                # Check writing status
                writing_status = row.get("writing status", "").strip().lower()

                if writing_status != "completed":
                    skipped_count += 1
                    continue

                # Validate required fields
                is_valid, error_msg = validate_term(row, row_num)

                if not is_valid:
                    errors.append(error_msg)
                    error_count += 1
                    continue

                # Create the markdown file
                success, message = create_markdown_file(row, output_dir)

                if success:
                    print(f"✓ {message}")
                    created_count += 1
                else:
                    errors.append(f"Row {row_num}: {message}")
                    error_count += 1

    except Exception as e:
        print(f"Error reading CSV file: {str(e)}")
        return

    # Print summary
    print("-" * 60)
    print(f"\nSummary:")
    print(f"  Created/Overwritten: {created_count} files")
    print(f"  Skipped: {skipped_count} (not completed)")
    print(f"  Errors: {error_count}")

    if errors:
        print(f"\nErrors encountered:")
        for error in errors:
            print(f"  ✗ {error}")


def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/import_terms.py <csv_file_path>")
        print("\nExample: python scripts/import_terms.py terms_export.csv")
        sys.exit(1)

    csv_file_path = sys.argv[1]
    import_terms(csv_file_path)


if __name__ == "__main__":
    main()
