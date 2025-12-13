
import os
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find <Image ... /> tags
    # This is a simple regex and might fail on complex multi-line props, but good start.
    # It matches <Image then any character until />
    # We want to find <Image ... > where 'alt=' is NOT present.
    
    # Better approach: Find all <Image ... /> strings, then check if 'alt=' is in them.
    
    image_tags = re.finditer(r'<Image\s+([^>]+)>', content)
    
    for match in image_tags:
        props = match.group(1)
        # Check if alt is present
        # Match alt=..., alt={...}, or alt="..."
        if not re.search(r'\balt\s*=', props):
            # Calculate line number
            line_num = content[:match.start()].count('\n') + 1
            print(f"Missing alt in {filepath} at line {line_num}")
            print(f"Tag: <Image {props}>")

def scan_dir(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.js') or file.endswith('.jsx'):
                check_file(os.path.join(root, file))

scan_dir(r'd:\GitHub\FileSafe\studio\src')
