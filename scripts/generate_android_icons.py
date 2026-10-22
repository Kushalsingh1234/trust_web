import os
from PIL import Image, ImageDraw

res_dir = 'android/app/src/main/res'
src_img_path = 'public/images/avatars/trust_emblem_cropped.png'
src = Image.open(src_img_path).convert('RGBA')

# Target sizes for Android mipmaps
# (folder, icon_size, fg_size)
densities = [
    ('mipmap-mdpi', 48, 108),
    ('mipmap-hdpi', 72, 162),
    ('mipmap-xhdpi', 96, 216),
    ('mipmap-xxhdpi', 144, 324),
    ('mipmap-xxxhdpi', 192, 432),
]

for folder, icon_size, fg_size in densities:
    out_dir = os.path.join(res_dir, folder)
    os.makedirs(out_dir, exist_ok=True)

    # 1. ic_launcher.png (standard square on #FFF8EF background)
    icon = Image.new('RGBA', (icon_size, icon_size), (255, 248, 239, 255))
    resized_src = src.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    icon.paste(resized_src, (0, 0), resized_src)
    icon.save(os.path.join(out_dir, 'ic_launcher.png'), 'PNG')

    # 2. ic_launcher_round.png (circular mask with smooth border)
    round_icon = Image.new('RGBA', (icon_size, icon_size), (0, 0, 0, 0))
    mask = Image.new('L', (icon_size, icon_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, icon_size - 1, icon_size - 1), fill=255)
    round_icon.paste(icon, (0, 0), mask=mask)
    round_icon.save(os.path.join(out_dir, 'ic_launcher_round.png'), 'PNG')

    # 3. ic_launcher_foreground.png (for adaptive icons, emblem centered in 70% safe zone)
    fg = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
    emblem_size = int(fg_size * 0.72)
    resized_emblem = src.resize((emblem_size, emblem_size), Image.Resampling.LANCZOS)
    offset = (fg_size - emblem_size) // 2
    fg.paste(resized_emblem, (offset, offset), resized_emblem)
    fg.save(os.path.join(out_dir, 'ic_launcher_foreground.png'), 'PNG')

    print(f"Generated icons for {folder}: {icon_size}x{icon_size}, fg {fg_size}x{fg_size}")

# Update splash screens with official website emblem
splash_folders = [
    'drawable',
    'drawable-land-mdpi',
    'drawable-land-hdpi',
    'drawable-land-xhdpi',
    'drawable-land-xxhdpi',
    'drawable-land-xxxhdpi',
    'drawable-port-mdpi',
    'drawable-port-hdpi',
    'drawable-port-xhdpi',
    'drawable-port-xxhdpi',
    'drawable-port-xxxhdpi'
]

for sf in splash_folders:
    s_path = os.path.join(res_dir, sf, 'splash.png')
    if os.path.exists(s_path):
        try:
            curr_s = Image.open(s_path)
            w, h = curr_s.size
            # Create a rich cream splash with centered official sun emblem
            splash = Image.new('RGBA', (w, h), (255, 248, 239, 255))
            emblem_dim = min(int(min(w, h) * 0.50), 380)
            if emblem_dim > 20:
                s_emblem = src.resize((emblem_dim, emblem_dim), Image.Resampling.LANCZOS)
                ox = (w - emblem_dim) // 2
                oy = (h - emblem_dim) // 2
                splash.paste(s_emblem, (ox, oy), s_emblem)
                splash.save(s_path, 'PNG')
                print(f"Updated splash for {sf} ({w}x{h})")
        except Exception as e:
            print(f"Could not update splash {sf}: {e}")

print("Official website emblem icons successfully generated!")
