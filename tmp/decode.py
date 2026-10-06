import urllib.request
import re

url = "https://script.google.com/macros/s/AKfycbxgGaIeT5DUI3MGEE-va3fzgVThrITG48KY61VcZT8SrCux8f8QRI6bykqo5E6NIa_a/exec"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
raw_html = urllib.request.urlopen(req).read().decode("utf-8", errors="ignore")

decoded = (
    raw_html.replace(r"\x3c", "<")
    .replace(r"\x3e", ">")
    .replace(r"\x22", '"')
    .replace(r"\x27", "'")
    .replace(r"\/", "/")
    .replace(r"\n", "\n")
)

with open("/tmp/reference_decoded.html", "w") as f:
    f.write(decoded)

titles = re.findall(r"<title>(.*?)</title>", decoded)
print("Title:", titles)

buttons = re.findall(r"<button[^>]*>(.*?)</button>", decoded)
clean_buttons = [re.sub(r"<[^>]+>", "", b).strip() for b in buttons if b.strip()]
print("Buttons (sample):", clean_buttons[:25])

headers = re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", decoded)
clean_headers = [re.sub(r"<[^>]+>", "", h).strip() for h in headers if h.strip()]
print("Headers (sample):", clean_headers[:25])
