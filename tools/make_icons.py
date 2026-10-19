"""生成 App 图标：纯 Python PNG 编码，无第三方依赖。"""
import math
import struct
import zlib
import os

BG = (25, 27, 30)
ORANGE = (228, 85, 43)
WHITE = (255, 255, 255)


def blend(base, top, a):
    return tuple(int(round(base[i] * (1 - a) + top[i] * a)) for i in range(3))


def render(size, maskable=False):
    """返回 RGBA 像素矩阵（list of bytearray）。"""
    scale = 4  # 超采样
    # maskable 图标：图形缩到 62%，留安全区
    ring_r = size * (0.245 if maskable else 0.30)
    ring_w = size * (0.062 if maskable else 0.076)
    dot_r = size * (0.040 if maskable else 0.048)
    corner = 0 if maskable else size * 0.22

    cx = cy = size / 2.0
    # 圆环缺口：数学角度 -58° ~ -8°（右上）
    gap_a0, gap_a1 = math.radians(-58), math.radians(-8)

    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            # 4x4 子采样
            acc_r = acc_g = acc_b = acc_a = 0.0
            for sy in range(scale):
                for sx in range(scale):
                    px = x + (sx + 0.5) / scale
                    py = y + (sy + 0.5) / scale

                    # 圆角矩形覆盖率
                    inside = True
                    if corner > 0:
                        rx = min(px, size - px)
                        ry = min(py, size - py)
                        if rx < corner and ry < corner:
                            dx = corner - rx
                            dy = corner - ry
                            if dx * dx + dy * dy > corner * corner:
                                inside = False
                    if not inside:
                        continue

                    col = BG
                    # 圆环
                    dx, dy = px - cx, py - cy
                    dist = math.hypot(dx, dy)
                    if abs(dist - ring_r) <= ring_w / 2:
                        ang = math.atan2(dy, dx)
                        in_gap = gap_a0 <= ang <= gap_a1
                        if not in_gap:
                            col = ORANGE
                    # 中心圆点
                    if dist <= dot_r:
                        col = WHITE

                    acc_r += col[0]
                    acc_g += col[1]
                    acc_b += col[2]
                    acc_a += 255

            n = scale * scale
            if acc_a == 0:
                row += bytes((0, 0, 0, 0))
            else:
                cov = acc_a / (255 * n)
                row += bytes((
                    int(round(acc_r / n)),
                    int(round(acc_g / n)),
                    int(round(acc_b / n)),
                    int(round(255 * cov)),
                ))
        rows.append(row)
    return rows


def write_png(path, size, rows):
    raw = b"".join(b"\x00" + bytes(r) for r in rows)
    comp = zlib.compress(raw, 9)

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", ihdr)
           + chunk(b"IDAT", comp)
           + chunk(b"IEND", b""))
    with open(path, "wb") as f:
        f.write(png)
    return len(png)


out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")
os.makedirs(out, exist_ok=True)

for sz, name, mk in ((192, "icon-192.png", False),
                     (512, "icon-512.png", False),
                     (512, "icon-maskable-512.png", True)):
    rows = render(sz, mk)
    n = write_png(os.path.join(out, name), sz, rows)
    print(f"{name}: {sz}x{sz}, {n} bytes")
