#!/usr/bin/env python3
"""
Sync glossary terms from Google Docs to Markdown files.

This script fetches terms from a Google Doc and generates markdown files
with YAML frontmatter for a Next.js glossary site.

Usage:
    python scripts/sync_glossary.py                    # Normal sync
    python scripts/sync_glossary.py --dry-run          # Preview without writing files
    python scripts/sync_glossary.py --verbose          # Show detailed parsing info

Setup:
    1. Enable Google Docs API at https://console.cloud.google.com/
    2. Create OAuth credentials (Desktop app) and download as credentials.json
    3. Place credentials.json in the scripts/ folder
    4. Run the script - it will open a browser for authentication on first run

Google Doc Format:
    - Heading 1: Section headers (become default tags, e.g., "Game Mechanics" -> "game-mechanics")
    - Heading 2: Term names (append ✓ to mark as completed, e.g., "CC Buffer ✓")
    - Optional metadata lines immediately after term name:
        - "Also known as: alt1, alt2" -> alternates field
        - "Tags: tag1, tag2" -> overrides section-based tag
        - "See also: term1, term2" -> links field
    - First blank line separates metadata from definition body
    - "(IN PROGRESS)" or "(IN PROG)" in term name -> skipped
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Optional

# Google API imports - will be checked at runtime
try:
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    GOOGLE_LIBS_AVAILABLE = True
except ImportError:
    GOOGLE_LIBS_AVAILABLE = False


# Configuration
CONFIG = {
    # Google Doc ID - extract from your doc URL:
    # https://docs.google.com/document/d/THIS_IS_THE_DOC_ID/edit
    "doc_id": "1BhACXoMJUJd41HbKex5Zv7jEBZ2xyooNeUzPbOqbjV8",
    
    # Tab name containing definitions
    "tab_name": "Written Definitions",
    
    # OAuth scopes (read-only access to Docs)
    "scopes": ["https://www.googleapis.com/auth/documents.readonly"],
    
    # Output directory relative to project root
    "output_dir": "src/data/terms",
    
    # Credentials file name (in scripts/ folder)
    "credentials_file": "credentials.json",
    
    # Token file name (in scripts/ folder, auto-generated)
    "token_file": "token.json",
}


class Term:
    """Represents a parsed glossary term."""
    
    def __init__(self, name: str, section: str):
        self.name = name
        self.section = section
        self.alternates: list[str] = []
        self.tags: list[str] = []
        self.links: list[str] = []
        self.definition_lines: list[str] = []
        self.is_completed = False
        self.is_in_progress = False
    
    @property
    def id(self) -> str:
        """Generate URL-safe ID from term name."""
        # Remove status markers and clean up
        clean_name = self.name.replace("✓", "").strip()
        clean_name = re.sub(r"\s*\(IN PROGRESS\)\s*", "", clean_name, flags=re.IGNORECASE)
        clean_name = re.sub(r"\s*\(IN PROG\)\s*", "", clean_name, flags=re.IGNORECASE)
        
        # Convert to lowercase, replace spaces with hyphens
        slug = clean_name.lower()
        slug = re.sub(r"[^\w\s-]", "", slug)  # Remove special chars except hyphens
        slug = re.sub(r"\s+", "-", slug)      # Spaces to hyphens
        slug = re.sub(r"-+", "-", slug)       # Collapse multiple hyphens
        return slug.strip("-")
    
    @property
    def filename(self) -> str:
        """Generate markdown filename."""
        return f"{self.id}.md"
    
    @property
    def clean_name(self) -> str:
        """Term name without status markers."""
        name = self.name.replace("✓", "").strip()
        name = re.sub(r"\s*\(IN PROGRESS\)\s*", "", name, flags=re.IGNORECASE)
        name = re.sub(r"\s*\(IN PROG\)\s*", "", name, flags=re.IGNORECASE)
        return name.strip()
    
    @property
    def effective_tags(self) -> list[str]:
        """Get tags - explicit tags override section-based default."""
        if self.tags:
            return self.tags
        # Convert section name to tag format
        return [self._section_to_tag(self.section)]
    
    def _section_to_tag(self, section: str) -> str:
        """Convert section header to tag format."""
        # "Game Mechanics" -> "game-mechanics"
        tag = section.lower()
        tag = re.sub(r"[^\w\s-]", "", tag)
        tag = re.sub(r"\s+", "-", tag)
        return tag.strip("-")
    
    @property
    def definition(self) -> str:
        """Get the full definition text."""
        return "\n".join(self.definition_lines).strip()
    
    def to_markdown(self) -> str:
        """Generate markdown file content with YAML frontmatter."""
        lines = ["---"]
        lines.append(f"id: {self.id}")
        lines.append(f"term: {self.clean_name}")
        
        # Tags
        tags_str = "[" + ", ".join(self.effective_tags) + "]"
        lines.append(f"tags: {tags_str}")
        
        # Alternates (optional)
        if self.alternates:
            alternates_str = "[" + ", ".join(f'"{alt}"' for alt in self.alternates) + "]"
            lines.append(f"alternates: {alternates_str}")
        
        # Links (optional)
        if self.links:
            links_str = "[" + ", ".join(self.links) + "]"
            lines.append(f"links: {links_str}")
        
        lines.append("---")
        lines.append("")
        lines.append(self.definition)
        lines.append("")
        
        return "\n".join(lines)


class GoogleDocsParser:
    """Parses Google Docs content into Term objects."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.current_section = "uncategorized"
        self.terms: list[Term] = []
    
    def log(self, message: str):
        """Print message if verbose mode is enabled."""
        if self.verbose:
            print(f"  [PARSE] {message}")
    
    def parse_document(self, doc: dict, tab_name: str) -> list[Term]:
        """Parse a Google Docs document and extract terms."""
        self.terms = []
        self.current_section = "uncategorized"
        
        # Find the correct tab
        tabs = doc.get("tabs", [])
        target_tab = None
        
        for tab in tabs:
            tab_properties = tab.get("tabProperties", {})
            if tab_properties.get("title") == tab_name:
                target_tab = tab
                break
        
        if not target_tab:
            # If no tabs or tab not found, try the main body (older doc format)
            if "body" in doc:
                self.log(f"No tab named '{tab_name}' found, using main document body")
                content = doc["body"].get("content", [])
            else:
                available_tabs = [t.get("tabProperties", {}).get("title", "unnamed") for t in tabs]
                raise ValueError(f"Tab '{tab_name}' not found. Available tabs: {available_tabs}")
        else:
            self.log(f"Found tab: {tab_name}")
            content = target_tab.get("documentTab", {}).get("body", {}).get("content", [])
        
        # Parse content elements
        current_term: Optional[Term] = None
        in_metadata_section = False
        
        for element in content:
            if "paragraph" not in element:
                continue
            
            paragraph = element["paragraph"]
            style = paragraph.get("paragraphStyle", {}).get("namedStyleType", "")
            text = self._extract_text(paragraph)
            
            # Skip empty paragraphs
            if not text.strip():
                if current_term and in_metadata_section:
                    # First blank line ends metadata section
                    in_metadata_section = False
                    self.log(f"  End of metadata section for '{current_term.clean_name}'")
                elif current_term and not in_metadata_section:
                    # Blank line within definition - preserve it
                    current_term.definition_lines.append("")
                continue
            
            # Heading 1 = Section header
            if style == "HEADING_1":
                self.current_section = text.strip()
                self.log(f"Section: {self.current_section}")
                continue
            
            # Heading 2 = Term name
            if style == "HEADING_2":
                # Save previous term if exists
                if current_term:
                    self.terms.append(current_term)
                
                # Start new term
                current_term = Term(text.strip(), self.current_section)
                in_metadata_section = True
                
                # Check completion status
                if "✓" in text:
                    current_term.is_completed = True
                    self.log(f"Term (completed): {current_term.clean_name}")
                elif "(IN PROGRESS)" in text.upper() or "(IN PROG)" in text.upper():
                    current_term.is_in_progress = True
                    self.log(f"Term (in progress): {current_term.clean_name}")
                else:
                    self.log(f"Term (no status): {current_term.clean_name}")
                continue
            
            # Normal paragraph - could be metadata or definition
            if current_term:
                if in_metadata_section:
                    # Try to parse as metadata
                    if self._try_parse_metadata(current_term, text):
                        continue
                    else:
                        # Not a metadata line, must be start of definition
                        in_metadata_section = False
                        self.log(f"  Definition starts: {text[:50]}...")
                
                # Add to definition
                current_term.definition_lines.append(text)
        
        # Don't forget the last term
        if current_term:
            self.terms.append(current_term)
        
        return self.terms
    
    def _extract_text(self, paragraph: dict) -> str:
        """Extract plain text from a paragraph element."""
        texts = []
        for element in paragraph.get("elements", []):
            if "textRun" in element:
                texts.append(element["textRun"].get("content", ""))
        return "".join(texts).rstrip("\n")
    
    def _try_parse_metadata(self, term: Term, text: str) -> bool:
        """
        Try to parse a line as metadata.
        Returns True if it was a metadata line, False otherwise.
        """
        text_lower = text.lower().strip()
        
        # Also known as:
        if text_lower.startswith("also known as:"):
            value = text[len("also known as:"):].strip()
            term.alternates = [alt.strip() for alt in value.split(",") if alt.strip()]
            self.log(f"  Alternates: {term.alternates}")
            return True
        
        # Tags:
        if text_lower.startswith("tags:"):
            value = text[len("tags:"):].strip()
            term.tags = [tag.strip() for tag in value.split(",") if tag.strip()]
            self.log(f"  Tags (override): {term.tags}")
            return True
        
        # See also:
        if text_lower.startswith("see also:"):
            value = text[len("see also:"):].strip()
            term.links = [link.strip() for link in value.split(",") if link.strip()]
            self.log(f"  Links: {term.links}")
            return True
        
        return False


def get_google_credentials(scripts_dir: Path) -> "Credentials":
    """Get or refresh Google API credentials."""
    creds = None
    token_path = scripts_dir / CONFIG["token_file"]
    credentials_path = scripts_dir / CONFIG["credentials_file"]
    
    # Check for credentials.json
    if not credentials_path.exists():
        print(f"\nError: {CONFIG['credentials_file']} not found in {scripts_dir}")
        print("\nSetup instructions:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create a new project (or select existing)")
        print("3. Enable the 'Google Docs API'")
        print("4. Go to 'Credentials' -> 'Create Credentials' -> 'OAuth client ID'")
        print("5. Choose 'Desktop app' as application type")
        print("6. Download the JSON file and save it as 'credentials.json' in scripts/")
        sys.exit(1)
    
    # Load existing token if available
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), CONFIG["scopes"])
    
    # Refresh or get new credentials
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Refreshing access token...")
            creds.refresh(Request())
        else:
            print("\nOpening browser for Google authentication...")
            print("(You'll only need to do this once)\n")
            flow = InstalledAppFlow.from_client_secrets_file(
                str(credentials_path), CONFIG["scopes"]
            )
            creds = flow.run_local_server(port=0)
        
        # Save credentials for next run
        with open(token_path, "w") as token:
            token.write(creds.to_json())
        print(f"Credentials saved to {token_path}\n")
    
    return creds


def fetch_document(creds: Credentials, doc_id: str) -> dict:
    """Fetch document content from Google Docs API."""
    service = build("docs", "v1", credentials=creds)
    
    # Use includeTabsContent to get all tabs
    document = service.documents().get(
        documentId=doc_id,
        includeTabsContent=True
    ).execute()
    
    return document


def sync_glossary(dry_run: bool = False, verbose: bool = False):
    """Main sync function."""
    
    # Check for Google libraries
    if not GOOGLE_LIBS_AVAILABLE:
        print("Error: Google API libraries not installed.")
        print("\nInstall with:")
        print("  pip install google-auth google-auth-oauthlib google-api-python-client")
        sys.exit(1)
    
    # Determine paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_dir = project_root / CONFIG["output_dir"]
    
    # Check doc ID is configured
    if CONFIG["doc_id"] == "YOUR_DOC_ID_HERE":
        print("Error: Please set your Google Doc ID in the CONFIG section of this script.")
        print("\nTo find your doc ID, look at your Google Doc URL:")
        print("  https://docs.google.com/document/d/YOUR_DOC_ID_HERE/edit")
        print("\nCopy the ID and paste it into CONFIG['doc_id'] in sync_glossary.py")
        sys.exit(1)
    
    # Check output directory
    if not output_dir.exists():
        print(f"Error: Output directory does not exist: {output_dir}")
        sys.exit(1)
    
    print("=" * 60)
    print("League Strategic Glossary Sync")
    print("=" * 60)
    print(f"Doc ID: {CONFIG['doc_id'][:20]}...")
    print(f"Tab: {CONFIG['tab_name']}")
    print(f"Output: {output_dir}")
    print(f"Mode: {'DRY RUN (no files written)' if dry_run else 'LIVE'}")
    print("=" * 60)
    
    # Authenticate
    print("\n[1/4] Authenticating with Google...")
    creds = get_google_credentials(script_dir)
    print("  ✓ Authenticated")
    
    # Fetch document
    print("\n[2/4] Fetching document...")
    doc = fetch_document(creds, CONFIG["doc_id"])
    title = doc.get("title", "Untitled")
    print(f"  ✓ Fetched: {title}")
    
    # Parse terms
    print("\n[3/4] Parsing terms...")
    parser = GoogleDocsParser(verbose=verbose)
    terms = parser.parse_document(doc, CONFIG["tab_name"])
    
    completed = [t for t in terms if t.is_completed]
    in_progress = [t for t in terms if t.is_in_progress]
    no_status = [t for t in terms if not t.is_completed and not t.is_in_progress]
    
    print(f"  Found {len(terms)} total terms:")
    print(f"    - {len(completed)} completed (will sync)")
    print(f"    - {len(in_progress)} in progress (skipped)")
    print(f"    - {len(no_status)} no status (skipped)")
    
    if no_status and verbose:
        print(f"  Terms without status marker:")
        for t in no_status[:5]:
            print(f"    - {t.clean_name}")
        if len(no_status) > 5:
            print(f"    ... and {len(no_status) - 5} more")
    
    # Write files
    print("\n[4/4] Writing markdown files...")
    written = 0
    errors = []
    
    for term in completed:
        filepath = output_dir / term.filename
        
        if dry_run:
            print(f"  [DRY RUN] Would write: {term.filename}")
            written += 1
        else:
            try:
                content = term.to_markdown()
                filepath.write_text(content, encoding="utf-8")
                print(f"  ✓ {term.filename}")
                written += 1
            except Exception as e:
                errors.append(f"{term.filename}: {e}")
                print(f"  ✗ {term.filename}: {e}")
    
    # Summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"  Written: {written} files")
    print(f"  Skipped: {len(in_progress) + len(no_status)} (not completed)")
    print(f"  Errors: {len(errors)}")
    
    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  ✗ {error}")
    
    if dry_run:
        print("\n[DRY RUN] No files were actually written.")
        print("Run without --dry-run to sync files.")


def main():
    parser = argparse.ArgumentParser(
        description="Sync glossary terms from Google Docs to Markdown files.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/sync_glossary.py              # Normal sync
  python scripts/sync_glossary.py --dry-run    # Preview changes
  python scripts/sync_glossary.py --verbose    # Detailed output
  python scripts/sync_glossary.py -v --dry-run # Preview with details
        """
    )
    parser.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="Preview changes without writing files"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed parsing information"
    )
    
    args = parser.parse_args()
    sync_glossary(dry_run=args.dry_run, verbose=args.verbose)


if __name__ == "__main__":
    main()
