"""Вставляет JSON с данными в страницу дашборда.

Использование: python3 build.py <страница.html> <данные.json> [<выход.html>]
Работает и с template.html (метка __DATA__), и с уже опубликованной страницей
(заменяет содержимое блока <script id="health-data">).
"""
import json, re, sys

page, data_path = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else page
html = open(page, encoding="utf-8").read()
data = json.load(open(data_path, encoding="utf-8"))
payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
pat = re.compile(r'(<script type="application/json" id="health-data">)(.*?)(</script>)', re.S)
if not pat.search(html):
    sys.exit("health-data block not found")
html = pat.sub(lambda m: m.group(1) + payload + m.group(3), html, count=1)
open(out, "w", encoding="utf-8").write(html)
print("ok", out, len(data.get("days", [])), "days")
