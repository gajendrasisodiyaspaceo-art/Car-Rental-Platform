#!/usr/bin/env bash
# PostToolUse(Write|Edit) hook: gentle, NON-BLOCKING TDD nudge.
# When a source file is changed and no sibling test file is detectable, remind to write a test first.
# Reads the tool-call JSON on stdin. Never blocks the edit.

input="$(cat)"

# Extract the edited file path without requiring jq.
file="$(printf '%s' "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"

# Only care about app source files.
case "$file" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# Ignore test files, configs, type decls, and the plugin's own files.
case "$file" in
  *.test.*|*.spec.*|*__tests__*|*.d.ts|*.config.*|*qa-tdd-plugin*) exit 0 ;;
esac

base="${file%.*}"
ext="${file##*.}"
dir="$(dirname "$file")"
name="$(basename "$base")"

# Heuristic: look for a matching test next to the file or under __tests__.
if [ -f "${base}.test.${ext}" ] || [ -f "${base}.spec.${ext}" ] \
   || ls "${dir}/__tests__/${name}".* >/dev/null 2>&1; then
  exit 0
fi

cat <<JSON
{
  "additionalContext": "TDD reminder: '${file}' changed but no matching test found. Per the test-driven-development skill, behavior changes should start with a failing test. Add or update one (e.g. ${name}.test.${ext})."
}
JSON
