"""Генератор иконки Nitron WidgetStudio: неоновая N с цианово-маджентовым свечением."""

import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

BG = (6, 7, 11, 255)
CYAN = (53, 224, 255)
MAGENTA = (255, 77, 227)

FONT_CANDIDATES = [
    "arialbd.ttf", "Arial Bold.ttf", "impact.ttf", "DejaVuSans-Bold.ttf",
]
FONT_DIRS = ["C:/Windows/Fonts", os.path.join(os.path.dirname(sys.executable), "Lib", "site-packages", "PIL")]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for d in FONT_DIRS:
        for name in FONT_CANDIDATES:
            path = os.path.join(d, name)
            if os.path.exists(path):
                try:
                    return ImageFont.truetype(path, size)
                except OSError:
                    continue
    return ImageFont.load_default()


def lerp(a: tuple, b: tuple, t: float) -> tuple:
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def neon_n(size: int, safe: float = 1.0) -> Image.Image:
    """Рисует N с градиентом cyan→magenta и мягким свечением. safe — доля безопасной зоны."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    font = load_font(int(size * 0.62 * safe))
    probe = ImageDraw.Draw(img)
    bbox = probe.textbbox((0, 0), "N", font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pos = ((size - tw) / 2 - bbox[0], (size - th) / 2 - bbox[1])

    # Маска буквы
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.text(pos, "N", font=font, fill=255)

    # Вертикальный градиент cyan → magenta
    grad = Image.new("RGBA", (size, size))
    gd = ImageDraw.Draw(grad)
    for yy in range(size):
        t = yy / max(1, size - 1)
        gd.line([(0, yy), (size, yy)], fill=lerp(CYAN, MAGENTA, t) + (255,))

    letter = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    letter.paste(grad, (0, 0), mask)

    # Свечение: размытая копия буквы
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow.paste(grad, (0, 0), mask)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.045))

    img.alpha_composite(glow)
    img.alpha_composite(glow)  # двойной проход = плотнее неон
    img.alpha_composite(letter)
    return img


def make_icon(size: int) -> Image.Image:
    """Полная иконка: тёмная подложка + сетка + N."""
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)

    # Тонкая сетка
    step = size // 16
    grid = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grid)
    for i in range(0, size + 1, step):
        gdraw.line([(i, 0), (i, size)], fill=(53, 224, 255, 14), width=2)
        gdraw.line([(0, i), (size, i)], fill=(53, 224, 255, 14), width=2)
    img.alpha_composite(grid)

    # Виньетка сверху слева
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd2 = ImageDraw.Draw(glow)
    gd2.ellipse([-size * 0.3, -size * 0.3, size * 0.55, size * 0.55], fill=(53, 224, 255, 36))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(size * 0.12)))

    img.alpha_composite(neon_n(size))
    return img


def main() -> None:
    out = os.path.join(os.path.dirname(__file__), "..", "assets")
    os.makedirs(out, exist_ok=True)

    make_icon(1024).convert("RGB").save(os.path.join(out, "icon.png"))

    # Adaptive foreground: N в безопасной зоне (66%), фон прозрачный
    fg = neon_n(1024, safe=0.66)
    fg.save(os.path.join(out, "android-icon-foreground.png"))

    # Monochrome: белая N
    mono_mask = Image.new("L", (1024, 1024), 0)
    md = ImageDraw.Draw(mono_mask)
    font = load_font(int(1024 * 0.62 * 0.66))
    bbox = md.textbbox((0, 0), "N", font=font)
    pos = ((1024 - (bbox[2] - bbox[0])) / 2 - bbox[0], (1024 - (bbox[3] - bbox[1])) / 2 - bbox[1])
    md.text(pos, "N", font=font, fill=255)
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mono.paste(Image.new("RGBA", (1024, 1024), (255, 255, 255, 255)), (0, 0), mono_mask)
    mono.save(os.path.join(out, "android-icon-monochrome.png"))

    # Adaptive background: тёмный с лёгким неоновым градиентом
    bg = Image.new("RGBA", (1024, 1024), BG)
    glow = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-300, -300, 500, 500], fill=(53, 224, 255, 60))
    gd.ellipse([600, 600, 1400, 1400], fill=(255, 77, 227, 46))
    bg.alpha_composite(glow.filter(ImageFilter.GaussianBlur(180)))
    bg.convert("RGB").save(os.path.join(out, "android-icon-background.png"))

    make_icon(64).convert("RGB").save(os.path.join(out, "favicon.png"))
    print("icons written to", os.path.abspath(out))


if __name__ == "__main__":
    main()
