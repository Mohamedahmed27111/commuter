import re

path = 'src/components/user/request/SeatSelector.tsx'
content = open(path, encoding='utf-8').read()

# Mojibake: each UTF-8 char was stored as its individual Latin-1 code points
# e.g. U+25B2 (▲) in UTF-8 is bytes E2 96 B2 -> stored as â (E2) ─ (96 in Latin-1) ² (B2)
# But what we actually see depends on exact byte values in file.

# From the terminal output we saw:
# â–² for ▲, â–¼ for ▼, âœ" for ✓, âœ• for ✕, Â· for ·, â"€ for ─

fixes = [
    ('\u00e2\u2013\u00b2', '\u25b2'),   # â–² -> ▲  (0x2013 = en dash, CP1252 for 0x96)
    ('\u00e2\u2013\u00bc', '\u25bc'),   # â–¼ -> ▼
    ('\u00e2\u0153\u201c', '\u2713'),   # âœ" -> ✓  (0x9C=œ, 0x93=")
    ('\u00e2\u0153\u2022', '\u2715'),   # âœ• -> ✕  (0x9C=œ, 0x95=•)
    ('\u00c2\u00b7', '\u00b7'),         # Â· -> ·
    ('\u00e2\u201c\u20ac', '\u2500'),   # â"€ -> ─  (0x80=€, 0x94=")
]

for old, new in fixes:
    n = content.count(old)
    content = content.replace(old, new)
    if n:
        print(f'Fixed {n}x: {repr(old)} -> {new}')

open(path, 'w', encoding='utf-8').write(content)
print('Done')
