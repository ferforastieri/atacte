#!/usr/bin/env python3
"""
Script para gerar logos do Atacte em diferentes tamanhos usando PIL
Gera imagens PNG diretamente sem precisar de bibliotecas SVG
"""

import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def generate_logo(size):
    """Gera a logo do Atacte em um tamanho específico"""
    # Criar imagem com transparência
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Cores
    green = (34, 197, 94)  # #22c55e
    dark_green = (21, 128, 61)  # #15803d
    white = (255, 255, 255)
    
    # Escalar baseado no tamanho
    scale = size / 32.0
    center = size // 2
    radius = int(14 * scale)
    
    # Desenhar círculo externo
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill=green,
        outline=dark_green,
        width=int(2 * scale)
    )
    
    # Desenhar cadeado
    lock_y = int(14 * scale)
    lock_width = int(12 * scale)
    lock_height = int(8 * scale)
    lock_x = center - lock_width // 2
    
    # Arco do cadeado (parte superior)
    arc_top = lock_y - int(2 * scale)
    draw.arc(
        [lock_x, arc_top - int(4 * scale), lock_x + lock_width, arc_top],
        start=180,
        end=0,
        fill=white,
        width=int(2 * scale)
    )
    
    # Corpo do cadeado (retângulo arredondado)
    draw.rounded_rectangle(
        [lock_x, lock_y, lock_x + lock_width, lock_y + lock_height],
        radius=int(2 * scale),
        fill=white
    )
    
    # Desenhar letra "A"
    try:
        # Tentar usar fonte do sistema
        font_size = int(8 * scale)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
            except:
                font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    text_y = int(26 * scale)
    draw.text(
        (center, text_y),
        "A",
        fill=dark_green,
        font=font,
        anchor="mm"  # middle-middle
    )
    
    return img

def main():
    # Diretórios
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    
    # Diretórios de saída
    mobile_assets = project_root / "mobile" / "assets"
    web_public = project_root / "web" / "public"
    desktop_build = project_root / "desktop" / "build"
    
    # Criar diretórios se não existirem
    mobile_assets.mkdir(parents=True, exist_ok=True)
    web_public.mkdir(parents=True, exist_ok=True)
    desktop_build.mkdir(parents=True, exist_ok=True)
    
    # Tamanhos necessários
    sizes = {
        # Mobile
        "mobile/assets/logo.png": 512,
        "mobile/assets/splash.png": 1024,
        
        # Web favicons
        "web/public/favicon-16.png": 16,
        "web/public/favicon-32.png": 32,
        "web/public/favicon-192.png": 192,
        "web/public/favicon-512.png": 512,
        "web/public/favicon.png": 32,
        "web/public/favicon-web.png": 32,
        "web/public/apple-touch-icon.png": 180,
        
        # Desktop
        "desktop/build/icon.png": 512,
    }
    
    print("Gerando logos do Atacte...")
    
    success_count = 0
    for relative_path, size in sizes.items():
        output_path = project_root / relative_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            img = generate_logo(size)
            img.save(output_path, 'PNG')
            print(f"✓ Gerado: {relative_path} ({size}x{size})")
            success_count += 1
        except Exception as e:
            print(f"✗ Falhou: {relative_path} - {e}")
    
    print(f"\n{success_count}/{len(sizes)} imagens geradas com sucesso!")

if __name__ == "__main__":
    main()

