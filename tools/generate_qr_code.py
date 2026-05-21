from pathlib import Path

try:
    import qrcode
    from PIL import Image, ImageDraw
    from qrcode.constants import ERROR_CORRECT_M
except ImportError as error:
    raise SystemExit(
        "Missing QR dependencies. Install them with: "
        "python -m pip install --user qrcode[pil]"
    ) from error


URL = "https://keldelcourt.com/"
OUTPUT_STEM = "keldel-court-qr"
FOREGROUND = "#1c1c1e"
BACKGROUND = "#ffffff"


def make_matrix():
    qr = qrcode.QRCode(
        version=3,
        error_correction=ERROR_CORRECT_M,
        box_size=1,
        border=0,
    )
    qr.add_data(URL)
    qr.make(fit=False)
    return qr.get_matrix()


def write_svg(matrix, output_path, module_size=12, quiet_zone=4):
    module_count = len(matrix)
    total_modules = module_count + quiet_zone * 2
    pixel_size = total_modules * module_size
    rects = []

    for y, row in enumerate(matrix):
        for x, module in enumerate(row):
            if module:
                rects.append(
                    f'<rect x="{(x + quiet_zone) * module_size}" '
                    f'y="{(y + quiet_zone) * module_size}" '
                    f'width="{module_size}" height="{module_size}"/>'
                )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{pixel_size}" '
        f'height="{pixel_size}" viewBox="0 0 {pixel_size} {pixel_size}" '
        f'role="img" aria-label="QR code for KelDel Court website">\n'
        f'  <title>KelDel Court website QR code</title>\n'
        f'  <desc>Scan to open {URL}</desc>\n'
        f'  <rect width="100%" height="100%" fill="{BACKGROUND}"/>\n'
        f'  <g fill="{FOREGROUND}">\n    '
        + "\n    ".join(rects)
        + "\n  </g>\n</svg>\n"
    )

    output_path.write_text(svg, encoding="utf-8")


def write_png(matrix, output_path, module_size=24, quiet_zone=4):
    module_count = len(matrix)
    total_modules = module_count + quiet_zone * 2
    pixel_size = total_modules * module_size
    image = Image.new("RGB", (pixel_size, pixel_size), BACKGROUND)
    draw = ImageDraw.Draw(image)

    for y, row in enumerate(matrix):
        for x, module in enumerate(row):
            if not module:
                continue

            x0 = (x + quiet_zone) * module_size
            y0 = (y + quiet_zone) * module_size
            draw.rectangle(
                (x0, y0, x0 + module_size - 1, y0 + module_size - 1),
                fill=FOREGROUND,
            )

    image.save(output_path)


def main():
    root = Path(__file__).resolve().parents[1]
    public = root / "public"
    matrix = make_matrix()

    svg_path = public / f"{OUTPUT_STEM}.svg"
    png_path = public / f"{OUTPUT_STEM}.png"

    write_svg(matrix, svg_path)
    write_png(matrix, png_path)

    print(f"Generated QR code for {URL}")
    print(svg_path)
    print(png_path)


if __name__ == "__main__":
    main()
