import os

base = r'D:\MERN Stack\Pet-Adoption-Management-System\client\src'

def write(rel, text):
    p = os.path.join(base, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as out:
        out.write(text.strip())
    print('Wrote:', rel)

