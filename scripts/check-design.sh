#!/usr/bin/env bash
# Verify the codebase against DESIGN.md constraints.
#
#   ./scripts/check-design.sh          run every check
#   ./scripts/check-design.sh 1        run checks required by Pass 1 and earlier
#
# Exit code is the number of failed checks. Checks above the requested pass
# level are reported as PENDING and do not count against the exit code.

set -uo pipefail
cd "$(dirname "$0")/.."

LEVEL="${1:-9}"
FAILS=0

TW_FAMILIES='slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
TW_PROPS='bg|text|border|ring|from|via|to|fill|stroke|shadow|decoration|outline|accent|caret|divide|placeholder'

# Files allowed to contain raw color values. tagColors is removed in Pass 4.
COLOR_EXEMPT='src/app/globals.css|src/config/tags.config.ts|src/data/glossaryData.ts'

check() { # check <required-pass> <name> <command...>
  local need=$1 name=$2; shift 2
  if [ "$need" -gt "$LEVEL" ]; then
    printf '  \033[2mPENDING\033[0m  %s (pass %s)\n' "$name" "$need"
    return
  fi
  local out
  out=$("$@" 2>/dev/null)
  if [ -z "$out" ]; then
    printf '  \033[32mPASS\033[0m     %s\n' "$name"
  else
    printf '  \033[31mFAIL\033[0m     %s\n' "$name"
    printf '%s\n' "$out" | sed 's/^/             /' | head -20
    FAILS=$((FAILS + 1))
  fi
}

# --- checks ------------------------------------------------------------------

no_tailwind_palette() {
  grep -rnE "($TW_PROPS)-($TW_FAMILIES)-[0-9]" src/ --include='*.tsx' --include='*.ts'
}

no_bw_keywords() {
  grep -rnE '\b(bg|text|border|ring|fill|stroke)-(white|black)\b' src/ \
    --include='*.tsx' --include='*.ts'
}

no_raw_hex() {
  grep -rnE '#[0-9a-fA-F]{3,8}\b' src/ --include='*.tsx' --include='*.ts' \
    | grep -vE "^($COLOR_EXEMPT)" | grep -v 'tagColors'
}

no_raw_functional_color() {
  # Literal color values only: the first argument is numeric.
  #   rgba(255, 255, 255, 0.06)  -> hardcoded, flagged
  #   rgba(t.ink, 0.06)          -> composed from a token, fine
  #   rgba(${r}, ${g}, ${b}, 1)  -> composed, fine
  # Canvas has no way to receive a color except as a resolved string, so any
  # correct implementation contains the substring. Matching bare `rgba(` here
  # was a false positive by construction.
  grep -rnE '(rgba?|hsla?)\(\s*[0-9]' src/ --include='*.tsx' --include='*.ts' \
    | grep -vE "^($COLOR_EXEMPT)"
}

theme_block_present() {
  # inverted: emits output only on failure
  grep -q -- '--color-\*: initial' src/app/globals.css || echo "globals.css: @theme missing --color-*: initial"
}

no_v3_directives() {
  grep -rn '@tailwind ' src/app/globals.css
}

no_legacy_utilities() {
  grep -rnE 'gold-gradient|shadow-paper-lg' src/
}

no_entry_cards() {
  # entry components must not use bordered/rounded/shadowed containers
  grep -rnE 'rounded|shadow-|border ' src/components/ListView.tsx src/components/TermPageContent.tsx
}

measure_capped() {
  # Tailwind v4: max-w-(--measure) compiles to var(--measure).
  # max-w-[--measure] compiles to the literal `--measure`, which browsers
  # silently drop — valid-looking, entirely inert. Flag it explicitly.
  local broken
  broken=$(grep -rn 'max-w-\[--' src/ --include='*.tsx' --include='*.ts')
  if [ -n "$broken" ]; then
    echo "$broken"
    echo "  ^ bracket form is inert in v4; use max-w-(--measure)"
    return
  fi
  grep -rq 'max-w-(--measure)\|max-w-\[6[0-9]ch\]\|max-w-\[7[0-2]ch\]' src/ \
    || echo "no measure cap found in src/"
}

no_tag_color_imports() {
  grep -rn 'tagColors' src/components/ src/app/
}

# --- run ---------------------------------------------------------------------

printf '\nDESIGN.md checks (level %s)\n\n' "$LEVEL"

check 1 "no Tailwind default palette classes"   no_tailwind_palette
check 1 "no bare white/black keywords"          no_bw_keywords
check 1 "no raw hex outside exempt files"       no_raw_hex
check 1 "no rgba()/hsla() outside exempt files" no_raw_functional_color
check 1 "@theme clears color namespace"         theme_block_present
check 1 "no v3 @tailwind directives"            no_v3_directives

check 2 "legacy gold/shadow utilities removed"  no_legacy_utilities
check 2 "no bordered cards in entry views"      no_entry_cards
check 2 "body measure capped at 68-72ch"        measure_capped

check 4 "tagColors fully removed"               no_tag_color_imports

printf '\n%s check(s) failed\n\n' "$FAILS"
exit "$FAILS"
