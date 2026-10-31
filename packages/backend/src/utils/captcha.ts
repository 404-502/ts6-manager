import crypto from 'crypto';
import { Resvg } from '@resvg/resvg-js';

/**
 * 登录图形验证码
 *
 * - 5 位字符，字符集剔除了易混淆的 I / L / O / 0 / 1
 * - 内存 Map 存储，TTL 5 分钟，最多 10000 条
 * - 一次性使用：verifyCaptcha() 校验即删除（无论成功与否）
 * - 使用 @resvg/resvg-js 把自拼的 SVG 渲染成 200x60 的 PNG
 */

/** 去掉 I L O 0 1 的字符集（35 个字符，避免人工识别混淆） */
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 5;

const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 分钟
const MAX_ENTRIES = 10_000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

const WIDTH = 200;
const HEIGHT = 60;
/** 主字体 DejaVu Sans，缺字时回退到等宽/无衬线族，避免容器内出现豆腐块 */
const FONT_FAMILY = 'DejaVu Sans, DejaVu Sans Mono, sans-serif';

interface CaptchaEntry {
  code: string;
  expiresAt: number;
}

const store = new Map<string, CaptchaEntry>();

/** 定时清理过期条目；unref() 保证不阻止进程退出 */
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[crypto.randomInt(CHARSET.length)];
  }
  return code;
}

function sha256(value: string): Buffer {
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

/** 插入前清理：先删过期，再按插入顺序淘汰最旧的，保证 Map 不超过上限 */
function evictIfNeeded(): void {
  if (store.size < MAX_ENTRIES) return;

  const now = Date.now();
  for (const [id, entry] of store) {
    if (entry.expiresAt <= now) store.delete(id);
  }
  while (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next();
    if (oldest.done) break;
    store.delete(oldest.value);
  }
}

function randomColor(): string {
  // 深色系，避免与浅色背景/噪点混淆
  const r = randInt(10, 110);
  const g = randInt(10, 110);
  const b = randInt(10, 130);
  return `rgb(${r},${g},${b})`;
}

function buildSvg(code: string): string {
  // 干扰线
  const lines: string[] = [];
  for (let i = 0; i < 6; i++) {
    lines.push(
      `<line x1="${randInt(0, WIDTH)}" y1="${randInt(0, HEIGHT)}" ` +
        `x2="${randInt(0, WIDTH)}" y2="${randInt(0, HEIGHT)}" ` +
        `stroke="rgba(${randInt(60, 180)},${randInt(60, 180)},${randInt(60, 180)},0.45)" ` +
        `stroke-width="${randInt(1, 2)}" />`,
    );
  }

  // 噪点
  const dots: string[] = [];
  for (let i = 0; i < 48; i++) {
    dots.push(
      `<circle cx="${randInt(0, WIDTH)}" cy="${randInt(0, HEIGHT)}" r="${randInt(1, 2)}" ` +
        `fill="rgba(${randInt(40, 190)},${randInt(40, 190)},${randInt(40, 190)},0.5)" />`,
    );
  }

  // 字符：随机旋转 + 偏移 + 轻微字号/颜色抖动
  const chars: string[] = [];
  const step = (WIDTH - 50) / (CODE_LENGTH - 1);
  for (let i = 0; i < code.length; i++) {
    const x = Math.round(25 + i * step + randInt(-5, 5));
    const y = HEIGHT / 2 + randInt(-5, 6);
    const angle = randInt(-20, 20);
    const fontSize = randInt(28, 34);
    chars.push(
      `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" ` +
        `font-family="${FONT_FAMILY}" font-size="${fontSize}" font-weight="bold" ` +
        `fill="${randomColor()}" transform="rotate(${angle} ${x} ${y})">${code[i]}</text>`,
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
    `viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
    `<rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#f2f4f7" />` +
    lines.join('') +
    dots.join('') +
    chars.join('') +
    `</svg>`
  );
}

function renderCaptchaPng(code: string): Buffer {
  const resvg = new Resvg(buildSvg(code), {
    fitTo: { mode: 'original' },
    font: {
      loadSystemFonts: true,
      defaultFontFamily: 'DejaVu Sans',
    },
  });
  return Buffer.from(resvg.render().asPng());
}

/**
 * 生成一张验证码。
 * 返回的 image 可直接作为 <img src> 使用（data:image/png;base64,...）。
 */
export function createCaptcha(): { id: string; image: string } {
  evictIfNeeded();

  const code = randomCode();
  const id = crypto.randomBytes(16).toString('hex');
  store.set(id, { code, expiresAt: Date.now() + CAPTCHA_TTL_MS });

  const png = renderCaptchaPng(code);
  return { id, image: `data:image/png;base64,${png.toString('base64')}` };
}

/**
 * 校验验证码，一次性使用：无论成功与否，校验后立即删除。
 * 大小写不敏感；用 sha256 摘要保证等长后用 timingSafeEqual 恒时比较。
 */
export function verifyCaptcha(id: string, input: string): boolean {
  if (typeof id !== 'string' || typeof input !== 'string') return false;

  const entry = store.get(id);
  if (!entry) return false;

  // 校验即删除：禁止同一个 id 被重复尝试
  store.delete(id);

  if (entry.expiresAt <= Date.now()) return false;

  const expected = sha256(entry.code.trim().toUpperCase());
  const actual = sha256(input.trim().toUpperCase());
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
