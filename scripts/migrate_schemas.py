import os
import re

SCHEMA_MAPPING = {
    'User': 'users/infrastructure/persistence/mongoose/schemas/user.schema',
    'Provider': 'providers/infrastructure/persistence/mongoose/schemas/provider.schema',
    'Order': 'orders/infrastructure/persistence/mongoose/schemas/order.schema',
    'Vehicle': 'vehicles/infrastructure/persistence/mongoose/schemas/vehicle.schema',
    'Service': 'services/infrastructure/persistence/mongoose/schemas/service.schema',
    'Wallet': 'wallet/infrastructure/persistence/mongoose/schemas/wallet.schema',
    'Transaction': 'wallet/infrastructure/persistence/mongoose/schemas/wallet.schema',
    'Review': 'reviews/infrastructure/persistence/mongoose/schemas/review.schema',
    'Notification': 'notifications/infrastructure/persistence/mongoose/schemas/notification.schema',
    'SubscriptionPlan': 'subscriptions/infrastructure/persistence/mongoose/schemas/subscription-plan.schema',
    'UserSubscription': 'subscriptions/infrastructure/persistence/mongoose/schemas/user-subscription.schema',
    'Admin': 'admin/infrastructure/persistence/mongoose/schemas/admin.schema',
    'Setting': 'admin/infrastructure/persistence/mongoose/schemas/setting.schema',
    'Chat': 'chat/infrastructure/persistence/mongoose/schemas/chat.schema'
}

def fix_schema_imports(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                
                new_lines = []
                changed = False
                
                for line in lines:
                    if 'database/schemas' in line:
                        changed = True
                        # Extract the imported members
                        match = re.search(r'import\s+\{(.*)\}\s+from\s+[\'"](.*)database/schemas(.*)[\'"]', line)
                        if match:
                            members = match.group(1).split(',')
                            members = [m.strip() for m in members if m.strip()]
                            
                            # For each member, we might need a separate import if they are from different modules
                            # But usually they are related. 
                            # Let's group them by destination
                            dests = {}
                            for m in members:
                                m_clean = m.split(' as ')[0].strip()
                                # Handle things like UserDocument, UserSchema
                                base_m = m_clean.replace('Document', '').replace('Schema', '')
                                if base_m in SCHEMA_MAPPING:
                                    dest = SCHEMA_MAPPING[base_m]
                                    if dest not in dests: dests[dest] = []
                                    dests[dest].append(m)
                                else:
                                    print(f"Unknown schema member {m} in {file_path}")
                            
                            for dest, members_list in dests.items():
                                # Calculate relative path
                                rel_to_src = os.path.relpath(file_path, root_dir)
                                depth = len(rel_to_src.split(os.sep)) - 1
                                prefix = '../' * depth
                                if prefix == '': prefix = './'
                                
                                new_line = f"import {{ {', '.join(members_list)} }} from '{prefix}modules/{dest}';\n"
                                new_lines.append(new_line)
                            continue # skip drawing the original line
                    
                    new_lines.append(line)
                
                if changed:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.writelines(new_lines)

if __name__ == "__main__":
    fix_schema_imports(r'e:\CarHero\car_hero_backend\src')
