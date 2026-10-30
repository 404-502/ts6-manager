"""生成 docs/i18n-inventory.md —— 中英文对照清单。

思路（比逐行 diff 干净得多）：
1. 对每个改动文件，从「HEAD 版本」与「工作区版本」分别按顺序抽取文本单元
   （JSX 文本节点、字符串字面量、属性值；Markdown 文件按行）。
2. 用 difflib.SequenceMatcher 对齐两个序列，只在 replace 块内配对。
3. 只收录「英文原文 -> 含中文译文」的对，并过滤过短碎片。

这样得到的是完整的字符串级映射，而不是字符级碎片。
"""
import difflib
import os
import re
import subprocess
import sys
import pathlib

CJK = re.compile(r'[\u4e00-\u9fff]')
LATIN = re.compile(r'[A-Za-z]')

# ts/tsx 文本单元：JSX 文本、单/双引号字符串、反引号字符串
JSX_TEXT = re.compile(r'>([^<>{}]+)<')
SQ = re.compile(r"'((?:[^'\\\n]|\\.)*)'")
DQ = re.compile(r'"((?:[^"\\\n]|\\.)*)"')
BT = re.compile(r'`((?:[^`\\\n]|\\.)*)`')

MIN_EN = 2       # 英文片段最短长度
MIN_ZH = 1       # 中文片段最短长度（有汉字即可）
MAX_CELL = 200   # 表格单元格最大长度，超出截断


def is_text_file(path):
    return path.endswith(('.ts', '.tsx', '.js', '.jsx', '.md', '.html', '.json', '.yml', '.yaml'))


def extract_units(path, content):
    """按文件类型抽取有序文本单元列表。"""
    units = []
    if path.endswith('.md'):
        for line in content.splitlines():
            s = line.strip()
            if not s:
                continue
            units.append(s)
        return units

    for line in content.splitlines():
        s = line.strip()
        if s.startswith('//') or s.startswith('*') or s.startswith('/*'):
            continue
        found = []
        for m in JSX_TEXT.finditer(line):
            found.append((m.start(), m.group(1)))
        for rx in (SQ, DQ, BT):
            for m in rx.finditer(line):
                found.append((m.start(), m.group(1)))
        found.sort(key=lambda x: x[0])
        for _, text in found:
            t = text.strip()
            if t:
                units.append(t)
    return units


def changed_files(base):
    """列出相对基准有改动的文件。"""
    r = subprocess.run(['git', 'diff', '--name-only', '--no-color', base],
                       capture_output=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        raise SystemExit('git diff 失败（基准 %s）：%s' % (base, r.stderr.strip()))
    return [p for p in r.stdout.splitlines() if p.strip()]


def base_show(path, base):
    """取基准版本的文件内容；基准里不存在该文件时返回 None（视为新增）。"""
    r = subprocess.run(['git', 'show', '%s:%s' % (base, path)],
                       capture_output=True, encoding='utf-8', errors='replace')
    return r.stdout if r.returncode == 0 else None


def pair_units(old_units, new_units):
    """序列对齐，返回 [(old_text, new_text)]。"""
    sm = difflib.SequenceMatcher(None, old_units, new_units, autojunk=False)
    pairs = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            continue
        olds = old_units[i1:i2]
        news = new_units[j1:j2]
        if len(olds) == len(news):
            # 一一对应（最常见：同一位置的文案被翻译）
            for o, n in zip(olds, news):
                if accept(o, n):
                    pairs.append((o, n))
        else:
            # 数量不等：用跨度的整体比对兜底
            for o in olds:
                for n in news:
                    if accept(o, n) and ratio(o, n) > 0.25:
                        pairs.append((o, n))
                        break
    return pairs


def accept(o, n):
    if o == n:
        return False
    if len(o.strip()) < MIN_EN or len(n.strip()) < MIN_ZH:
        return False
    if not LATIN.search(o):
        return False
    if not CJK.search(n):
        return False
    return True


def ratio(a, b):
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio()


def clip(s, n=MAX_CELL):
    s = re.sub(r'\s+', ' ', s).strip()
    s = s.replace('|', '\\|')
    if len(s) > n:
        s = s[:n] + '…'
    return s


def main():
    base = os.environ.get('I18N_BASE', 'HEAD')
    files = changed_files(base)
    if not files:
        print('基准 %s 与工作区无差异。' % base, file=sys.stderr)
        return 1

    results = []
    for path in files:
        if not is_text_file(path):
            continue
        old = base_show(path, base)
        try:
            new = pathlib.Path(path).read_text(encoding='utf-8')
        except Exception:
            continue
        if not new or old == new:
            continue
        old_units = extract_units(path, old or '')
        new_units = extract_units(path, new)
        pairs = pair_units(old_units, new_units)
        if pairs:
            # 去重但保留顺序
            seen, uniq = set(), []
            for a, b in pairs:
                if (a, b) in seen:
                    continue
                seen.add((a, b))
                uniq.append((a, b))
            results.append((path, uniq))

    results.sort(key=lambda x: x[0])
    total = sum(len(p) for _, p in results)

    L = []
    L.append('# 汉化对照清单')
    L.append('')
    L.append('本文件从 git 提交差异中自动提取，记录汉化时每一处「英文原文 → 中文译文」的映射。')
    L.append('')
    L.append('**用途**：上游仓库更新后，若某段英文被改写，可在此按原文检索，')
    L.append('快速确认该处原本译成什么，从而只重译变化的部分，不必整份文件重来。')
    L.append('')
    L.append('**维护**：每完成一轮上游同步后重新生成（命令见文末）。')
    L.append('')
    L.append('## 统计')
    L.append('')
    L.append('| 项 | 数量 |')
    L.append('|---|---|')
    L.append('| 涉及文件 | %d |' % len(results))
    L.append('| 对照条目 | %d |' % total)
    L.append('')
    L.append('## 目录')
    L.append('')
    for path, pairs in results:
        anchor = path.replace('/', '').replace('.', '').replace('_', '').lower()
        L.append('- [`%s`](#%s) — %d 条' % (path, anchor, len(pairs)))
    L.append('')

    for path, pairs in results:
        L.append('## `%s`' % path)
        L.append('')
        L.append('| 英文原文 | 中文译文 |')
        L.append('|---|---|')
        for a, b in pairs:
            L.append('| `%s` | %s |' % (clip(a), clip(b)))
        L.append('')

    L.append('---')
    L.append('')
    L.append('## 重新生成')
    L.append('')
    L.append('清单基准是 `upstream-base` 引用，即「上一次与上游对齐时的原始英文版本」。')
    L.append('')
    L.append('首次生成（`upstream-base` 尚未建立）时用默认的 `HEAD`：')
    L.append('')
    L.append('```bash')
    L.append('python scripts/gen-i18n-inventory.py')
    L.append('```')
    L.append('')
    L.append('同步上游后，把基准指到 `upstream-base` 再跑一次即可得到全量对照：')
    L.append('')
    L.append('```bash')
    L.append('I18N_BASE=upstream-base python scripts/gen-i18n-inventory.py')
    L.append('```')
    L.append('')
    L.append('PowerShell：`$env:I18N_BASE="upstream-base"; python scripts/gen-i18n-inventory.py`')
    L.append('')

    out = pathlib.Path('docs/i18n-inventory.md')
    out.write_text('\n'.join(L), encoding='utf-8')
    print('文件数 %d，条目 %d -> %s' % (len(results), total, out))
    return 0


if __name__ == '__main__':
    sys.exit(main())
