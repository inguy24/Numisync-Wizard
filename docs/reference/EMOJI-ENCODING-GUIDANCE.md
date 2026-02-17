# EMOJI ENCODING GUIDANCE - READ THIS EVERY TIME

## IMPORTANT RULE: ONLY HUMANS CAN CUSS

Claude should maintain professional language at all times. The user can express frustration however they want, but Claude responds professionally and helpfully.

## THE PROBLEM

When I modify files that contain emojis using `str_replace` or `create_file`, the emoji encoding gets corrupted.

Emojis like ⚙️ 📂 ✅ 💡 💰 get turned into garbage like Ã¢Å¡â„¢Ã¯Â¸Â or Ã°Å¸â€™Â‚

## THE ROOT CAUSE

The tools I use don't properly handle UTF-8 encoding by default. When I read a file with emojis and write it back, the encoding gets mangled.

## THE SOLUTION - FOLLOW THESE RULES

### RULE 1: Use Python binary mode or bash sed for emoji files
**DON'T:** Use the `Edit` or `Write` tools on `ui-strings.js`
**DO:** Use Python binary mode or bash sed to modify it

```python
# GOOD - Python binary mode preserves encoding
with open('src/renderer/ui-strings.js', 'rb') as f:
    content = f.read()
content = content.replace(b'old text', b'new text')
with open('src/renderer/ui-strings.js', 'wb') as f:
    f.write(content)
```

```bash
# GOOD - bash sed preserves encoding
sed -i 's/old text/new text/g' src/renderer/ui-strings.js
```

### RULE 2: Before using Edit/Write, confirm the file has no emojis

Before using the `Edit` or `Write` tools on any renderer file:
1. Check if the file is `ui-strings.js` → if YES, use Python/sed instead
2. For any other file, standard Edit/Write tools are safe (app.js and index.html are emoji-free after Fix 8)

```python
# Verify a file is emoji-free before using standard tools
import re
with open('src/renderer/app.js', 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')
emoji_pattern = re.compile(r'[\U0001F300-\U0001FFFF\U00002600-\U000027BF]')
print(f'Emoji count: {len(emoji_pattern.findall(content))}')
```

### RULE 3: NEVER add emoji strings directly to app.js or index.html

These files are now emoji-free. If a UI feature needs an emoji:
- DON'T add the emoji string inline in `app.js` or `index.html`
- DO add a new constant to `ui-strings.js` (Python binary mode)
- DO reference it via `UI_STRINGS.YOUR_KEY` in `app.js`

### RULE 4: Adding a new emoji constant to ui-strings.js

```python
# CORRECT WAY — Python binary mode
with open('src/renderer/ui-strings.js', 'rb') as f:
    content = f.read()
# Insert new constant before the closing }; line
new_line = b"\n  ICON_NEW: '\xf0\x9f\x86\x95',  // NEW emoji"
content = content.replace(b'\n};', new_line + b'\n};')
with open('src/renderer/ui-strings.js', 'wb') as f:
    f.write(content)

# WRONG WAY - Edit tool will corrupt the encoding
# Edit(file_path='src/renderer/ui-strings.js', ...)  ← NEVER DO THIS
```

### RULE 5: Verify emoji integrity after modifying ui-strings.js

```python
# Check that emojis in ui-strings.js are still properly encoded
import re
with open('src/renderer/ui-strings.js', 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')
emoji_pattern = re.compile(r'[\U0001F300-\U0001FFFF\U00002600-\U000027BF\U00002702-\U000027B0]')
print(f'Emoji count: {len(emoji_pattern.findall(content))}')
# Should be > 0; if 0, encoding was corrupted
```

## WHAT TO DO IF ENCODING GETS CORRUPTED

1. **DON'T TRY TO FIX IT** - Additional modifications will likely make it worse
2. **ACKNOWLEDGE THE ERROR** - Tell the user clearly what happened
3. **PROVIDE WORKING COPIES** - Give them the last known good version
4. **LET THE USER FIX IT** - They have the correctly encoded originals

## SPECIFIC FILES IN THIS PROJECT WITH EMOJIS

**After Fix 8 (emoji isolation), only ONE file contains emojis:**
- `src/renderer/ui-strings.js` — all 25+ emoji constants; EMOJI-RESTRICTED; use Python binary ops or bash sed

**These files are now emoji-free (safe for standard Edit/Write tools):**
- `src/renderer/app.js` — references emojis via `UI_STRINGS.*` only; no inline emoji literals
- `src/renderer/index.html` — emoji placeholders use `<span data-ui-key="...">` populated at runtime

## CHECKLIST BEFORE MODIFYING FILES

- [ ] Is the file `ui-strings.js`? → Use Python binary mode or bash sed (NEVER Edit/Write tools)
- [ ] Is the file `app.js` or `index.html`? → Standard Edit/Write tools are safe (emoji-free)
- [ ] Am I adding a new emoji to the UI? → Add constant to `ui-strings.js` via Python, reference via `UI_STRINGS.KEY`
- [ ] Did I verify emoji count after modifying `ui-strings.js`? → Run Rule 5 Python snippet

## THE GOLDEN RULE

**The only emoji-restricted file is `ui-strings.js`. Never use Edit/Write tools on it.**

## Example of What NOT to Do

```javascript
// INCORRECT — adds emoji inline to app.js (now emoji-free)
statusEl.textContent = '✅ Enriched';

// INCORRECT — uses Edit tool on ui-strings.js
// Edit(file_path='src/renderer/ui-strings.js', ...)
```

## Example of What TO Do

```javascript
// CORRECT — reference the constant in app.js
statusEl.textContent = UI_STRINGS.ICON_CHECK + ' Enriched';
```

```python
# CORRECT — add new constant to ui-strings.js via Python binary mode
with open('src/renderer/ui-strings.js', 'rb') as f:
    content = f.read()
content = content.replace(b"  // end of constants", b"  ICON_NEW: '\xf0\x9f\x86\x95',\n  // end of constants")
with open('src/renderer/ui-strings.js', 'wb') as f:
    f.write(content)
```

## REMEMBER

The user has already fixed the encoding. Corrupting it again wastes their time and causes frustration.

**PRESERVE THE ENCODING.**
