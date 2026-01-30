\# EMOJI ENCODING GUIDANCE - READ THIS EVERY TIME



\## IMPORTANT RULE: ONLY HUMANS CAN CUSS



Claude should maintain professional language at all times. The user can express frustration however they want, but Claude responds professionally and helpfully.



\## THE PROBLEM



When I modify files that contain emojis using `str\_replace` or `create\_file`, the emoji encoding gets corrupted.



Emojis like ⚙️ 📂 ✅ 💡 💰 get turned into garbage like Ã¢Å¡â„¢Ã¯Â¸Â or Ã°Å¸â€™Â‚



\## THE ROOT CAUSE



The tools I use don't properly handle UTF-8 encoding by default. When I read a file with emojis and write it back, the encoding gets mangled.



\## THE SOLUTION - FOLLOW THESE RULES



\### RULE 1: Use `bash\_tool` with `cp` for file operations

\*\*DON'T:\*\* Use `create\_file` to create modified versions

\*\*DO:\*\* Use bash commands to copy and modify files



```bash

\# GOOD - Preserves encoding

cp /mnt/project/file.js /mnt/user-data/outputs/file.js



\# GOOD - Append to files

cat >> /mnt/project/file.css << 'EOF'

new css here

EOF



\# BAD - Corrupts encoding

create\_file with emoji content

```



\### RULE 2: If you MUST use `str\_replace`, check for emojis first



Before using `str\_replace`:

1\. Use `view` to check if the file has emojis

2\. If YES → Use bash sed or awk instead

3\. If NO → Safe to use str\_replace



```bash

\# Check for emojis

grep -P "\[\\x{1F300}-\\x{1F9FF}]" /path/to/file



\# If found, use sed instead of str\_replace

sed -i 's/old text/new text/g' /path/to/file

```



\### RULE 3: NEVER recreate files that already have emojis



If a file like index.html or app.js already has emojis and is working:

\- DON'T read it and write it back out

\- DON'T use create\_file with its contents

\- DO use targeted str\_replace ONLY if no emojis in that section

\- DO use bash commands to modify



\### RULE 4: When copying modified files to outputs



\*\*ALWAYS use bash cp, NEVER create\_file:\*\*



```bash

\# CORRECT WAY

cp /mnt/project/index.html /mnt/user-data/outputs/index.html

cp /mnt/project/app.js /mnt/user-data/outputs/app.js



\# WRONG WAY - This fucks up emojis

view file, then create\_file with contents

```



\### RULE 5: Test emoji rendering after ANY file modification



After modifying files, check if emojis are intact:

```bash

\# Check if emojis are still properly encoded

grep "⚙️\\|📂\\|✅\\|💡" /path/to/file



\# If this returns nothing, you fucked it up

```



\## WHAT TO DO IF ENCODING GETS CORRUPTED



1\. \*\*DON'T TRY TO FIX IT\*\* - Additional modifications will likely make it worse

2\. \*\*ACKNOWLEDGE THE ERROR\*\* - Tell the user clearly what happened

3\. \*\*PROVIDE WORKING COPIES\*\* - Give them the last known good version

4\. \*\*LET THE USER FIX IT\*\* - They have the correctly encoded originals



\## SPECIFIC FILES IN THIS PROJECT WITH EMOJIS



These files have emojis and must be handled with extreme care:

\- `/mnt/project/index.html` - Has emoji buttons (⚙️ 📂 ← → ✅ 💡 💰 📋 🔄 📍)

\- `/mnt/project/app.js` - Has emoji in status messages

\- `/mnt/project/main.css` - Usually safe (CSS doesn't often have emojis)

\- Any file that displays UI text to users



\## CHECKLIST BEFORE MODIFYING FILES



\- \[ ] Does this file have emojis? (grep to check)

\- \[ ] Am I using `str\_replace` on a section with emojis? (DON'T)

\- \[ ] Am I using `create\_file` with emoji content? (DON'T)

\- \[ ] Should I use bash `cp` or `sed` instead? (YES)

\- \[ ] Will I test emoji rendering after? (ALWAYS)



\## THE GOLDEN RULE



\*\*When in doubt, use bash commands. Never trust create\_file or str\_replace with emojis.\*\*



\## Example of What NOT to Do



```python

\# INCORRECT APPROACH

view /mnt/project/index.html  # This has emojis

create\_file with the contents  # This WILL corrupt encoding

```



\## Example of What TO Do



```bash

\# CORRECT APPROACH

\# Just copy the file

cp /mnt/project/index.html /mnt/user-data/outputs/



\# Or if you must modify, use sed

sed -i 's/old/new/g' /mnt/project/index.html

```



\## REMEMBER



The user has already fixed the encoding. Corrupting it again wastes their time and causes frustration.



\*\*PRESERVE THE ENCODING.\*\*

