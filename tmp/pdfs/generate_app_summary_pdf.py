from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(r"C:\Users\bingi\medo-veda")
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_PATH = OUTPUT_DIR / "medo-veda-app-summary.pdf"
LOGO_PATH = ROOT / "medo-veda-logo.png"


TITLE = "Medo-Veda"
SUBTITLE = "One-page app summary based on repo evidence"

WHAT_IT_IS = (
    "Medo-Veda is an AI-powered health app for analyzing product ingredients and "
    "clinical-style scan inputs. The repo shows a React frontend paired with an "
    "Express backend that runs a multi-agent analysis pipeline and returns verdicts, "
    "scores, and reports."
)

WHO_ITS_FOR = (
    "People who want ingredient safety insights tailored to a personal health profile; "
    "the product flows and dashboard also suggest a user persona focused on tracking "
    "scan history and health-oriented recommendations."
)

FEATURES = [
    "Scans product data from image upload, manual text entry, or voice input.",
    "Uploads image files, then runs asynchronous analysis with polling status updates.",
    "Builds a stored user persona with age, gender, conditions, goals, diet, weight, and height.",
    "Generates report verdicts, health scores, recommendations, evidence, and alternatives.",
    "Shows dashboard summaries plus scan history and report views in the frontend.",
    "Caches prior analyses in Redis and stores long-term records in PostgreSQL.",
]

ARCHITECTURE = [
    "Frontend: React + Vite single-page app with routes for landing, auth, dashboard, scan, history, and report pages.",
    "API: Express server exposes auth, profile, dashboard, scan, image extraction, and async status/result endpoints.",
    "Upload flow: Multer writes temp files; image scans upload to Cloudinary before analysis.",
    "Analysis flow: scan controller checks Redis cache, loads the user's persona from PostgreSQL, then calls the orchestrator.",
    "Pipeline: the orchestrator runs vision extraction for images plus 9 agent modules for persona, product, ingredients, claims, recommendations, evidence, alternatives, verdict, and presentation.",
    "Persistence: PostgreSQL stores personas and scans; Upstash Redis stores hot cache entries and scan lookups.",
]

RUN_STEPS = [
    "Backend: `cd backend` then `npm install` and `npm start`.",
    "Frontend: `cd frontend` then `npm install` and `npm run dev`.",
    "Frontend API target: set `VITE_API_URL` if the backend is not at `http://127.0.0.1:3001`.",
    "Required backend env values are implied by code and README: Gemini/AI, PostgreSQL, Redis, and Cloudinary credentials.",
    "Database migration/seed order: Not found in repo.",
]

FOOTNOTE = (
    "Evidence sources used: README plus frontend/backend routes, controllers, cache, DB, and pipeline files."
)


def wrap_text(text, font_name, font_size, max_width):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_paragraph(c, text, x, y, max_width, font_name="Helvetica", font_size=9.3, leading=12):
    for line in wrap_text(text, font_name, font_size, max_width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_bullets(c, items, x, y, max_width, bullet_gap=11, font_size=8.7, leading=10.5):
    bullet_width = 10
    for item in items:
        lines = wrap_text(item, "Helvetica", font_size, max_width - bullet_width)
        c.setFont("Helvetica-Bold", font_size)
        c.drawString(x, y, "-")
        c.setFont("Helvetica", font_size)
        c.drawString(x + bullet_gap, y, lines[0])
        current_y = y
        for line in lines[1:]:
            current_y -= leading
            c.drawString(x + bullet_gap, current_y, line)
        y = current_y - (leading + 1)
    return y


def draw_section_label(c, label, x, y, width):
    c.setFillColor(colors.HexColor("#0f766e"))
    c.roundRect(x, y - 10, width, 18, 6, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 8, y - 4, label.upper())
    c.setFillColor(colors.HexColor("#16302c"))


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(OUTPUT_PATH), pagesize=letter)
    width, height = letter

    page_bg = colors.HexColor("#f5fbf9")
    ink = colors.HexColor("#16302c")
    muted = colors.HexColor("#48635d")
    accent = colors.HexColor("#0f766e")
    border = colors.HexColor("#d7ebe5")
    panel = colors.white

    c.setTitle("Medo-Veda App Summary")
    c.setFillColor(page_bg)
    c.rect(0, 0, width, height, stroke=0, fill=1)

    margin = 32
    gutter = 18
    left_w = 248
    right_w = width - (margin * 2) - gutter - left_w
    left_x = margin
    right_x = left_x + left_w + gutter
    top = height - 34

    c.setFillColor(panel)
    c.roundRect(margin, 26, width - (margin * 2), height - 52, 18, stroke=0, fill=1)
    c.setStrokeColor(border)
    c.setLineWidth(1)
    c.roundRect(margin, 26, width - (margin * 2), height - 52, 18, stroke=1, fill=0)

    if LOGO_PATH.exists():
        c.drawImage(ImageReader(str(LOGO_PATH)), margin + 18, top - 32, width=28, height=28, mask="auto")

    c.setFillColor(ink)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(margin + 54, top - 10, TITLE)
    c.setFont("Helvetica", 9.5)
    c.setFillColor(muted)
    c.drawString(margin + 54, top - 24, SUBTITLE)

    c.setStrokeColor(border)
    c.line(margin + 18, top - 40, width - margin - 18, top - 40)

    y_left = top - 60
    draw_section_label(c, "What It Is", left_x + 14, y_left, 82)
    c.setFillColor(ink)
    c.setFont("Helvetica", 9.2)
    y_left = draw_paragraph(c, WHAT_IT_IS, left_x + 14, y_left - 22, left_w - 28, font_size=9.2, leading=11.5)

    y_left -= 10
    draw_section_label(c, "Who It's For", left_x + 14, y_left, 88)
    c.setFont("Helvetica", 9.2)
    y_left = draw_paragraph(c, WHO_ITS_FOR, left_x + 14, y_left - 22, left_w - 28, font_size=9.2, leading=11.5)

    y_left -= 10
    draw_section_label(c, "How To Run", left_x + 14, y_left, 78)
    c.setFillColor(ink)
    y_left = draw_bullets(c, RUN_STEPS, left_x + 14, y_left - 22, left_w - 28, font_size=8.4, leading=10)

    c.setFillColor(colors.HexColor("#e8f5f1"))
    c.roundRect(left_x + 12, 54, left_w - 24, 54, 12, stroke=0, fill=1)
    c.setFillColor(accent)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(left_x + 24, 92, "Repo gaps called out explicitly")
    c.setFillColor(muted)
    c.setFont("Helvetica", 8.4)
    note_lines = wrap_text("Migration and seeding sequence are not documented as a single startup workflow in the repo.", "Helvetica", 8.4, left_w - 52)
    current_y = 79
    for line in note_lines:
        c.drawString(left_x + 24, current_y, line)
        current_y -= 10

    y_right = top - 60
    draw_section_label(c, "What It Does", right_x + 14, y_right, 86)
    c.setFillColor(ink)
    y_right = draw_bullets(c, FEATURES, right_x + 14, y_right - 22, right_w - 28, font_size=8.8, leading=10.5)

    y_right -= 2
    draw_section_label(c, "How It Works", right_x + 14, y_right, 90)
    y_right = draw_bullets(c, ARCHITECTURE, right_x + 14, y_right - 22, right_w - 28, font_size=8.65, leading=10.2)

    c.setStrokeColor(border)
    c.line(margin + 18, 50, width - margin - 18, 50)
    c.setFillColor(muted)
    c.setFont("Helvetica", 7.8)
    c.drawString(margin + 18, 36, FOOTNOTE)

    c.save()
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
