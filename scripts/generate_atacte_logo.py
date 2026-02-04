#!/usr/bin/env python3
"""
Script para gerar logos do Atacte em diferentes tamanhos
Gera imagens PNG a partir da logo SVG
"""

import os
import sys
from pathlib import Path

try:
    from cairosvg import svg2png
    HAS_CAIROSVG = True
except ImportError:
    try:
        from svglib.svglib import svg2rlg
        from reportlab.graphics import renderPM
        HAS_SVGLIB = True
        HAS_CAIROSVG = False
    except ImportError:
        HAS_CAIROSVG = False
        HAS_SVGLIB = False
        print("AVISO: Instale cairosvg ou svglib para gerar imagens")
        print("  pip install cairosvg")
        print("  ou")
        print("  pip install svglib reportlab")

# SVG da logo Atacte
LOGO_SVG = """<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="#22c55e" stroke="#15803d" stroke-width="2"/>
  <path d="M12 14v-2a4 4 0 1 1 8 0v2" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <rect x="10" y="14" width="12" height="8" rx="2" ry="2" fill="white"/>
  <text x="16" y="26" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#15803d">A</text>
</svg>"""

def generate_png_from_svg(svg_content, output_path, size):
    """Gera PNG a partir de SVG"""
    if HAS_CAIROSVG:
        svg2png(bytestring=svg_content.encode('utf-8'), 
                write_to=str(output_path), 
                output_width=size, 
                output_height=size)
        return True
    elif HAS_SVGLIB:
        # Converter SVG para PNG usando svglib
        drawing = svg2rlg(svg_content)
        if drawing:
            renderPM.drawToFile(drawing, str(output_path), fmt='PNG', configPIL={'size': (size, size)})
            return True
    return False

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
        
        # Ajustar SVG para o tamanho desejado
        svg_content = LOGO_SVG.replace('width="32"', f'width="{size}"').replace('height="32"', f'height="{size}"')
        
        if generate_png_from_svg(svg_content, output_path, size):
            print(f"✓ Gerado: {relative_path} ({size}x{size})")
            success_count += 1
        else:
            print(f"✗ Falhou: {relative_path}")
    
    print(f"\n{success_count}/{len(sizes)} imagens geradas com sucesso!")
    
    if success_count < len(sizes):
        print("\nPara gerar todas as imagens, instale uma das bibliotecas:")
        print("  pip install cairosvg")
        print("  ou")
        print("  pip install svglib reportlab")

if __name__ == "__main__":
    main()

