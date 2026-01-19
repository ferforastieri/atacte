#!/usr/bin/env python3
"""
Script para gerar novas logos com 'S' para o Sentro
Lê a logo original, remove a letra 'A' e desenha 'S' no lugar
"""

import os
from PIL import Image, ImageDraw, ImageFont
import sys

# Tentar importar numpy
try:
    import numpy as np
    USE_NUMPY = True
except ImportError:
    print("AVISO: numpy não está instalado. Usando método alternativo sem numpy.")
    print("Para melhor resultado, instale numpy: sudo apt-get install python3-numpy")
    USE_NUMPY = False

def remove_letter_area(img, center_x, center_y, font_size):
    """
    Remove a área onde está a letra 'A' preenchendo com a cor de fundo
    ou com transparência
    """
    # Estimar o tamanho da área do texto
    text_width = int(font_size * 0.8)  # Aproximadamente 80% do tamanho da fonte
    text_height = int(font_size * 1.2)  # Um pouco mais alto para garantir
    
    # Criar uma máscara para a área do texto
    # Vamos criar uma região retangular um pouco maior que o texto
    left = center_x - text_width // 2 - 5
    top = center_y - text_height // 2 - 5
    right = center_x + text_width // 2 + 5
    bottom = center_y + text_height // 2 + 5
    
    # Pegar a cor de fundo próxima (pixels ao redor da área do texto)
    # Vamos usar a cor do círculo (verde) ou transparência
    width, height = img.size
    
    # Tentar detectar a cor de fundo próxima
    # Pegar pixels ao redor da área do texto
    sample_pixels = []
    for y in range(max(0, top - 20), min(height, bottom + 20)):
        for x in range(max(0, left - 20), min(width, right + 20)):
            if not (left <= x <= right and top <= y <= bottom):
                pixel = img.getpixel((x, y))
                sample_pixels.append(pixel)
    
    if sample_pixels:
        # Usar a cor mais comum (moda) dos pixels ao redor
        # Ou usar a cor verde do círculo
        bg_color = (34, 197, 94, 255)  # Verde padrão #22c55e
        if img.mode == 'RGBA':
            # Tentar encontrar a cor de fundo real
            colors = {}
            for pixel in sample_pixels[:100]:  # Limitar para performance
                if len(pixel) == 4:
                    color_key = tuple(pixel)
                    colors[color_key] = colors.get(color_key, 0) + 1
            if colors:
                bg_color = max(colors.items(), key=lambda x: x[1])[0]
    else:
        # Fallback: usar verde ou transparência
        bg_color = (34, 197, 94, 255) if img.mode == 'RGBA' else (34, 197, 94)
    
    # Preencher a área do texto com a cor de fundo
    draw = ImageDraw.Draw(img)
    
    # Desenhar um retângulo arredondado na área do texto para "limpar"
    # Usar um retângulo um pouco maior para garantir que remove tudo
    padding = 3
    draw.rounded_rectangle(
        [(left - padding, top - padding), (right + padding, bottom + padding)],
        radius=2,
        fill=bg_color
    )
    
    return img

def replace_letter_in_logo(input_path, output_path, old_letter='A', new_letter='S'):
    """
    Lê a logo original, remove a letra 'A' e desenha 'S' no lugar
    """
    try:
        # Abrir a logo original
        img = Image.open(input_path)
        
        # Converter para RGBA se necessário para manter transparência
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        width, height = img.size
        
        # Estimar onde está a letra (geralmente no centro inferior do círculo)
        center_x = width // 2
        center_y = int(height * 0.75)  # Geralmente a letra está na parte inferior do círculo
        
        # Tamanho estimado da fonte baseado no tamanho da imagem
        font_size = int(width * 0.15)  # Aproximadamente 15% do tamanho da imagem
        
        # Primeiro, remover a área onde está o 'A'
        img = remove_letter_area(img, center_x, center_y, font_size)
        
        # Agora desenhar o 'S' no lugar
        draw = ImageDraw.Draw(img)
        
        # Tentar carregar uma fonte
        try:
            # Tentar diferentes fontes do sistema
            font_paths = [
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                "/System/Library/Fonts/Helvetica.ttc",
                "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
                "arial.ttf",
            ]
            
            font = None
            for font_path in font_paths:
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    break
                except:
                    continue
            
            if font is None:
                # Usar fonte padrão como último recurso
                font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        # Detectar a cor do texto original
        # Vamos usar verde escuro padrão, mas tentar detectar da imagem
        text_color = (21, 128, 61, 255)  # #15803d - verde escuro padrão
        
        # Tentar detectar a cor do texto original analisando pixels
        # na área onde provavelmente estava o texto
        sample_y = int(height * 0.75)
        pixels_to_check = [
            (center_x - 15, sample_y),
            (center_x - 10, sample_y),
            (center_x, sample_y),
            (center_x + 10, sample_y),
            (center_x + 15, sample_y),
        ]
        
        # Analisar pixels para encontrar a cor do texto
        # O texto geralmente é mais escuro que o fundo verde
        text_colors = []
        for x, y in pixels_to_check:
            if 0 <= x < width and 0 <= y < height:
                pixel = img.getpixel((x, y))
                if isinstance(pixel, tuple):
                    # Se o pixel é escuro (provavelmente parte do texto)
                    if len(pixel) >= 3:
                        r, g, b = pixel[:3]
                        brightness = (r + g + b) / 3
                        if brightness < 100:  # Pixel escuro
                            text_colors.append(pixel[:3])
        
        if text_colors:
            # Usar a cor mais comum dos pixels escuros
            from collections import Counter
            color_counts = Counter([tuple(c) for c in text_colors])
            most_common = color_counts.most_common(1)[0][0]
            text_color = most_common + (255,) if len(most_common) == 3 else most_common
        
        # Desenhar sombra sutil para melhor visibilidade
        shadow_offset = max(1, width // 512)
        draw.text(
            (center_x + shadow_offset, center_y + shadow_offset),
            new_letter,
            fill=(0, 0, 0, 50),  # Sombra semi-transparente
            font=font,
            anchor='mm'
        )
        
        # Desenhar a letra 'S'
        draw.text(
            (center_x, center_y),
            new_letter,
            fill=text_color,
            font=font,
            anchor='mm'  # anchor='mm' significa que o ponto é o centro médio do texto
        )
        
        # Salvar a imagem
        img.save(output_path, 'PNG', optimize=True)
        return True
        
    except Exception as e:
        print(f"ERRO ao processar {input_path}: {e}")
        import traceback
        traceback.print_exc()
        return False

def generate_all_logos_from_original():
    """Gera todas as logos a partir da logo original, substituindo apenas a letra"""
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    original_logo = os.path.join(base_dir, 'mobile', 'assets', 'logo.png')
    
    # Verificar se a logo original existe
    if not os.path.exists(original_logo):
        print(f"ERRO: Logo original não encontrada em {original_logo}")
        print("Por favor, certifique-se de que a logo original existe.")
        return False
    
    print(f"Lendo logo original: {original_logo}")
    
    # Logo principal para mobile (mesmo tamanho)
    mobile_assets_dir = os.path.join(base_dir, 'mobile', 'assets')
    os.makedirs(mobile_assets_dir, exist_ok=True)
    
    logo_path = os.path.join(mobile_assets_dir, 'logo.png')
    if replace_letter_in_logo(original_logo, logo_path):
        print(f"✓ Logo gerada: {logo_path}")
    
    # Splash screen (redimensionar se necessário)
    splash_path = os.path.join(mobile_assets_dir, 'splash.png')
    try:
        original_img = Image.open(original_logo)
        # Se a splash precisa ser maior, redimensionar
        if original_img.size[0] < 1024:
            splash_img = original_img.resize((1024, 1024), Image.Resampling.LANCZOS)
            # Aplicar substituição de letra na versão redimensionada
            temp_path = splash_path + '.temp'
            splash_img.save(temp_path, 'PNG')
            if replace_letter_in_logo(temp_path, splash_path):
                os.remove(temp_path)
                print(f"✓ Splash gerada: {splash_path}")
        else:
            if replace_letter_in_logo(original_logo, splash_path):
                print(f"✓ Splash gerada: {splash_path}")
    except Exception as e:
        print(f"ERRO ao gerar splash: {e}")
    
    # Logos para Android (diferentes densidades)
    android_res_dir = os.path.join(base_dir, 'mobile', 'android', 'app', 'src', 'main', 'res')
    
    sizes = {
        'drawable-mdpi': 48,
        'drawable-hdpi': 72,
        'drawable-xhdpi': 96,
        'drawable-xxhdpi': 144,
        'drawable-xxxhdpi': 192,
    }
    
    for folder, size in sizes.items():
        folder_path = os.path.join(android_res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)
        logo_path = os.path.join(folder_path, 'splashscreen_logo.png')
        
        try:
            # Redimensionar a logo original para o tamanho necessário
            original_img = Image.open(original_logo)
            resized_img = original_img.resize((size, size), Image.Resampling.LANCZOS)
            temp_path = logo_path + '.temp'
            resized_img.save(temp_path, 'PNG')
            
            if replace_letter_in_logo(temp_path, logo_path):
                os.remove(temp_path)
                print(f"✓ Logo Android gerada: {logo_path} ({size}x{size})")
        except Exception as e:
            print(f"ERRO ao gerar logo Android {folder}: {e}")
    
    # Favicons para web
    web_public_dir = os.path.join(base_dir, 'web', 'public')
    os.makedirs(web_public_dir, exist_ok=True)
    
    favicon_sizes = [16, 32, 192, 512]
    for size in favicon_sizes:
        favicon_path = os.path.join(web_public_dir, f'favicon-{size}.png')
        try:
            original_img = Image.open(original_logo)
            resized_img = original_img.resize((size, size), Image.Resampling.LANCZOS)
            temp_path = favicon_path + '.temp'
            resized_img.save(temp_path, 'PNG')
            
            if replace_letter_in_logo(temp_path, favicon_path):
                os.remove(temp_path)
                print(f"✓ Favicon gerado: {favicon_path} ({size}x{size})")
        except Exception as e:
            print(f"ERRO ao gerar favicon {size}: {e}")
    
    # Favicon principal e apple-touch-icon
    try:
        original_img = Image.open(original_logo)
        
        # favicon.png (32x32)
        favicon_path = os.path.join(web_public_dir, 'favicon.png')
        resized_img = original_img.resize((32, 32), Image.Resampling.LANCZOS)
        temp_path = favicon_path + '.temp'
        resized_img.save(temp_path, 'PNG')
        if replace_letter_in_logo(temp_path, favicon_path):
            os.remove(temp_path)
            print(f"✓ Favicon principal gerado: {favicon_path}")
        
        # favicon-web.png (32x32)
        favicon_web_path = os.path.join(web_public_dir, 'favicon-web.png')
        if replace_letter_in_logo(favicon_path, favicon_web_path):
            print(f"✓ Favicon web gerado: {favicon_web_path}")
        
        # apple-touch-icon.png (180x180)
        apple_icon_path = os.path.join(web_public_dir, 'apple-touch-icon.png')
        resized_img = original_img.resize((180, 180), Image.Resampling.LANCZOS)
        temp_path = apple_icon_path + '.temp'
        resized_img.save(temp_path, 'PNG')
        if replace_letter_in_logo(temp_path, apple_icon_path):
            os.remove(temp_path)
            print(f"✓ Apple touch icon gerado: {apple_icon_path}")
    except Exception as e:
        print(f"ERRO ao gerar ícones web: {e}")
    
    print("\n✓ Todas as logos foram geradas com sucesso!")
    return True

if __name__ == '__main__':
    print("Gerando logos do Sentro substituindo 'A' por 'S'...")
    print("=" * 60)
    
    try:
        generate_all_logos_from_original()
    except ImportError:
        print("ERRO: Pillow (PIL) não está instalado.")
        print("Instale com: pip install Pillow")
        sys.exit(1)
    except Exception as e:
        print(f"ERRO ao gerar logos: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
