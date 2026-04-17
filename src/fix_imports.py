import os

def fix_imports(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Dynamic fix for status.enum
                # We want to change things like ../../../../core/enums/status.enum 
                # to the correct relative path based on file depth
                
                if 'core/enums/status.enum' in content or 'core/enums/roles.enum' in content or 'core/decorators' in content or 'core/utils' in content or 'core/interfaces' in content:
                    # Calculate depth relative to src
                    rel_to_src = os.path.relpath(file_path, root_dir)
                    depth = len(rel_to_src.split(os.sep)) - 1
                    
                    correct_prefix = '../' * depth
                    if correct_prefix == '': correct_prefix = './'
                    
                    import re
                    # General fix for anything in core/
                    content = re.sub(r'["\']\.+/\.+/\.+/\.+/core/(.*?)["\']', f"'{correct_prefix}core/\\1'", content)
                    content = re.sub(r'["\']\.+/\.+/\.+/core/(.*?)["\']', f"'{correct_prefix}core/\\1'", content)
                    content = re.sub(r'["\']\.+/\.+/core/(.*?)["\']', f"'{correct_prefix}core/\\1'", content)

                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)

if __name__ == "__main__":
    fix_imports(r'e:\CarHero\car_hero_backend\src')
