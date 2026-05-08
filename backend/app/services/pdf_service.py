
# # """
# # Offer Letter & Certificate generator using python-docx template substitution.

# # Strategy: Use the real Grasim docx template (with exact logos, header, footer,
# # fonts, margins) as the base. Substitute only the dynamic text nodes in the XML,
# # leaving all formatting, images, and layout completely untouched.

# # This produces a 100% layout-identical output to the original letter.
# # """

# # import os
# # import re
# # import copy
# # import shutil
# # from datetime import datetime
# # from zipfile import ZipFile
# # from lxml import etree
# # from app.core.config import settings

# # UPLOAD_DIR = settings.UPLOAD_DIR
# # TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pdf", "templates")

# # # Word XML namespace
# # W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


# # def _ensure_dir(path: str):
# #     os.makedirs(path, exist_ok=True)


# # def _ordinal(n: int) -> str:
# #     """Return ordinal string: 1 -> '1st', 2 -> '2nd', etc."""
# #     if 10 <= n % 100 <= 20:
# #         suffix = "th"
# #     else:
# #         suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
# #     return f"{n}{suffix}"


# # def _format_date_long(d) -> str:
# #     """Format date as '20th May 2025'"""
# #     if not d:
# #         return ""
# #     return f"{_ordinal(d.day)} {d.strftime('%B %Y')}"


# # def _format_date_letter(d) -> str:
# #     """Format date as '19-apr-2026' for the top of the letter"""
# #     if not d:
# #         return ""
# #     return d.strftime("%d-%b-%Y").lower()


# # def _get_full_text(paragraph_elem) -> str:
# #     """Get concatenated text of all <w:t> elements in a paragraph."""
# #     return "".join(
# #         t.text or ""
# #         for t in paragraph_elem.iter(f"{{{W}}}t")
# #     )


# # def _set_paragraph_text(paragraph_elem, new_text: str):
# #     """
# #     Replace all runs in a paragraph with a single run containing new_text,
# #     preserving the formatting of the first run found.
# #     """
# #     ns = f"{{{W}}}"

# #     # Find the first run to copy its formatting (rPr)
# #     first_run = paragraph_elem.find(f"{ns}r")
# #     first_rpr = None
# #     if first_run is not None:
# #         first_rpr = first_run.find(f"{ns}rPr")

# #     # Remove all existing runs (but keep pPr)
# #     for r in paragraph_elem.findall(f"{ns}r"):
# #         paragraph_elem.remove(r)

# #     # Create new run with preserved formatting
# #     new_run = etree.SubElement(paragraph_elem, f"{ns}r")
# #     if first_rpr is not None:
# #         new_run.insert(0, copy.deepcopy(first_rpr))

# #     new_t = etree.SubElement(new_run, f"{ns}t")
# #     new_t.text = new_text
# #     if new_text.startswith(" ") or new_text.endswith(" "):
# #         new_t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


# # def _remove_paragraph(body_elem, paragraph_elem):
# #     """Remove a paragraph element from body."""
# #     body_elem.remove(paragraph_elem)


# # def _insert_paragraph_after(body_elem, ref_elem, new_para_elem):
# #     """Insert new_para_elem after ref_elem in body."""
# #     idx = list(body_elem).index(ref_elem)
# #     body_elem.insert(idx + 1, new_para_elem)


# # def _make_text_paragraph(reference_para, text: str) -> etree.Element:
# #     """Create a new paragraph element cloned from reference_para with given text."""
# #     ns = f"{{{W}}}"
# #     new_p = copy.deepcopy(reference_para)
# #     # Clear all runs
# #     for r in new_p.findall(f"{ns}r"):
# #         new_p.remove(r)
# #     # Add single run
# #     first_run = reference_para.find(f"{ns}r")
# #     first_rpr = None
# #     if first_run is not None:
# #         first_rpr = first_run.find(f"{ns}rPr")
# #     new_run = etree.SubElement(new_p, f"{ns}r")
# #     if first_rpr is not None:
# #         new_run.insert(0, copy.deepcopy(first_rpr))
# #     new_t = etree.SubElement(new_run, f"{ns}t")
# #     new_t.text = text
# #     if text and (text.startswith(" ") or text.endswith(" ")):
# #         new_t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
# #     return new_p


# # async def generate_offer_letter_pdf(record) -> str:
# #     """
# #     Generate offer letter docx using the official Grasim template.
# #     Returns the URL path to the generated file.
# #     """
# #     candidate = record.candidate
# #     template_path = os.path.join(TEMPLATES_DIR, "offer_letter_template.docx")

# #     if not os.path.exists(template_path):
# #         raise FileNotFoundError(f"Offer letter template not found: {template_path}")

# #     # Build substitution data
# #     full_name = candidate.full_name if candidate else "Candidate"
# #     first_name = full_name.split()[0] if full_name else "Candidate"
# #     gender = candidate.gender if candidate else "male"
# #     salutation = "Mr." if gender == "male" else "Ms."

# #     institute = candidate.institute_name or ""
# #     city = candidate.city or ""
# #     state = candidate.state or ""
# #     location = record.location or ""
# #     duration_weeks = record.duration_weeks or ""

# #     # Dates
# #     letter_date = _format_date_letter(record.start_date or datetime.now())
# #     start_str = _format_date_long(record.start_date)
# #     end_str = _format_date_long(record.end_date)

# #     # Stipend
# #     has_stipend = record.stipend_amount and float(record.stipend_amount) > 0
# #     stipend_str = f"Rs {int(record.stipend_amount):,}/- per month" if has_stipend else ""

# #     # HR signatory — use letter_format from masters if configured
# #     hr_name = settings.HR_HEAD_NAME
# #     hr_title = settings.HR_HEAD_TITLE
# #     hr_division = location

# #     try:
# #         from app.core.database import SessionLocal
# #         from app.models.models import MasterData
# #         db = SessionLocal()
# #         try:
# #             row = db.query(MasterData).filter(MasterData.id == 1).first()
# #             if row and row.letter_formats:
# #                 fmt = next(
# #                     (f for f in row.letter_formats if f.get("department") == record.department),
# #                     None
# #                 )
# #                 if fmt:
# #                     hr_name = fmt.get("signatory", hr_name).split("\n")[0].strip()
# #                     hr_division = fmt.get("department", hr_division)
# #         finally:
# #             db.close()
# #     except Exception:
# #         pass

# #     # Copy template to working location
# #     out_dir = os.path.join(UPLOAD_DIR, "offer_letters")
# #     _ensure_dir(out_dir)
# #     filename = f"offer_{record.id}.docx"
# #     out_path = os.path.join(out_dir, filename)
# #     shutil.copy2(template_path, out_path)

# #     # Parse and modify document XML inside the docx zip
# #     with ZipFile(out_path, "r") as zin:
# #         doc_xml = zin.read("word/document.xml")

# #     tree = etree.fromstring(doc_xml)
# #     body = tree.find(f"{{{W}}}body")
# #     paragraphs = body.findall(f"{{{W}}}p")

# #     ns = f"{{{W}}}"

# #     for para in paragraphs:
# #         text = _get_full_text(para)

# #         # ── Date line ─────────────────────────────────────────
# #         if text.strip() == "Date":
# #             _set_paragraph_text(para, letter_date)

# #         # ── Salutation + Name (Mr./Ms. Full Name) ─────────────
# #         elif text.strip() == "Name":
# #             _set_paragraph_text(para, f"{salutation} {full_name}")

# #         # ── College/Institute ──────────────────────────────────
# #         elif text.strip() == "College Name":
# #             _set_paragraph_text(para, institute)

# #         # ── City / Location ────────────────────────────────────
# #         elif text.strip() == "Location":
# #             loc_text = city
# #             if state:
# #                 loc_text += f"\nDistrict- {state}"
# #             _set_paragraph_text(para, loc_text)

# #         # ── Dear Name ──────────────────────────────────────────
# #         elif text.strip() == "Dear Name,":
# #             _set_paragraph_text(para, f"Dear {first_name},")

# #         # ── Body paragraph with duration/dates ─────────────────
# #         elif "…………… weeks starting from" in text or "weeks starting from" in text:
# #             # Rebuild this paragraph with dynamic content
# #             new_body_text = (
# #                 f"This is in regard to your request letter for internship with "
# #                 f"Grasim Industries Ltd. (Grasim). We are pleased to inform you "
# #                 f"that you have been accepted as an Intern for a period of "
# #                 f"{duration_weeks} weeks starting from {start_str} to {end_str}."
# #             )
# #             # We need to handle the mixed formatting in this paragraph carefully
# #             # Find and replace the full text while preserving runs structure
# #             # Simplest: replace all runs with one run using first run's format
# #             # The bold/italic on "at LOCATION" will be rebuilt if location exists
# #             _set_paragraph_text(para, new_body_text)

# #         # ── Stipend bullet ─────────────────────────────────────
# #         elif "You will be paid a Stipend" in text:
# #             if has_stipend:
# #                 # Replace the amount while keeping the sentence structure
# #                 # Rebuild with correct amount
# #                 _set_paragraph_text(
# #                     para,
# #                     f"You will be paid a Stipend of {stipend_str}, inclusive of all taxes."
# #                 )
# #             else:
# #                 # No stipend — remove this bullet paragraph entirely
# #                 body.remove(para)

# #         # ── Signatory name ─────────────────────────────────────
# #         elif text.strip() == "Sheba Banerjee":
# #             _set_paragraph_text(para, hr_name)

# #         # ── Signatory division (MBDD) ──────────────────────────
# #         elif text.strip() == "MBDD":
# #             _set_paragraph_text(para, hr_division)

# #     # Write modified XML back into the docx
# #     modified_xml = etree.tostring(tree, xml_declaration=True, encoding="UTF-8", standalone=True)

# #     # Repack the docx with modified document.xml
# #     import tempfile
# #     tmp_path = out_path + ".tmp"
# #     with ZipFile(out_path, "r") as zin:
# #         with ZipFile(tmp_path, "w") as zout:
# #             for item in zin.infolist():
# #                 if item.filename == "word/document.xml":
# #                     zout.writestr(item, modified_xml)
# #                 else:
# #                     zout.writestr(item, zin.read(item.filename))

# #     os.replace(tmp_path, out_path)
# #     return f"/uploads/offer_letters/{filename}"


# # async def generate_certificate_pdf(record, payload) -> str:
# #     """
# #     Generate experience certificate using the official Grasim certificate template.
# #     Uses docx template substitution — preserves exact logo, layout, fonts, footer.
# #     Returns the URL path to the generated .docx file.
# #     """
# #     candidate = record.candidate
# #     template_path = os.path.join(TEMPLATES_DIR, "certificate_template.docx")

# #     if not os.path.exists(template_path):
# #         raise FileNotFoundError(f"Certificate template not found: {template_path}")

# #     # Build all dynamic values
# #     full_name  = candidate.full_name if candidate else "Candidate"
# #     gender     = candidate.gender if candidate else "male"
# #     salutation = "Mr." if gender == "male" else "Ms."
# #     pronoun    = "his" if gender == "male" else "her"  # "during his/her tenure"

# #     institute  = candidate.institute_name or ""
# #     location   = record.location or ""
# #     weeks      = record.duration_weeks or ""
# #     conduct    = payload.conduct_remark.lower()  # "good", "excellent", etc.
# #     project    = payload.project_title
# #     guides     = payload.guide_names

# #     # Dates — ordinal format: "20th May 2025"
# #     start_str = _format_date_long(record.start_date)
# #     end_str   = _format_date_long(record.end_date)

# #     # Issue date — "July 28, 2025" format (matches original)
# #     issue_date = payload.issue_date
# #     issue_str  = issue_date.strftime("%B") + " " + str(issue_date.day) + ", " + str(issue_date.year)

# #     # HR signatory
# #     hr_name     = settings.HR_HEAD_NAME
# #     hr_division = location
# #     try:
# #         from app.core.database import SessionLocal
# #         from app.models.models import MasterData
# #         db = SessionLocal()
# #         try:
# #             row = db.query(MasterData).filter(MasterData.id == 1).first()
# #             if row and row.letter_formats:
# #                 fmt = next(
# #                     (f for f in row.letter_formats if f.get("department") == record.department),
# #                     None
# #                 )
# #                 if fmt:
# #                     hr_name     = fmt.get("signatory", hr_name).split("\n")[0].strip()
# #                     hr_division = fmt.get("department", hr_division)
# #         finally:
# #             db.close()
# #     except Exception:
# #         pass

# #     # Copy template
# #     out_dir  = os.path.join(UPLOAD_DIR, "certificates")
# #     _ensure_dir(out_dir)
# #     filename = f"cert_{record.id}.docx"
# #     out_path = os.path.join(out_dir, filename)
# #     shutil.copy2(template_path, out_path)

# #     # Parse document XML
# #     with ZipFile(out_path, "r") as zin:
# #         doc_xml = zin.read("word/document.xml")

# #     tree = etree.fromstring(doc_xml)
# #     body = tree.find(f"{{{W}}}body")
# #     paragraphs = body.findall(f"{{{W}}}p")

# #     for para in paragraphs:
# #         text = _get_full_text(para)

# #         # ── Issue date (top of letter) ─────────────────────────
# #         if text.strip() in ("July 28, 2025", "July 28,2025") or (
# #             "2025" in text and len(text.strip()) < 20 and
# #             any(m in text for m in ["January","February","March","April","May","June",
# #                                      "July","August","September","October","November","December"])
# #         ):
# #             _set_paragraph_text(para, issue_str)

# #         # ── Main certify paragraph ─────────────────────────────
# #         elif "This is to certify that" in text:
# #             # Build: "This is to certify that Mr. Niket Totala, a student of VJTI, Mumbai
# #             #          has successfully completed his Internship at TRADC
# #             #          (Grasim Industries Limited), for the period of 8 weeks
# #             #          starting from 20th May 2025 to 18th July 2025."
# #             new_text = (
# #                 f"This is to certify that {salutation} {full_name}, "
# #                 f"a student of {institute} has successfully completed "
# #                 f"{pronoun} Internship at {location} (Grasim Industries Limited), "
# #                 f"for the period of {weeks} weeks starting from "
# #                 f"{start_str} to {end_str}."
# #             )
# #             _set_paragraph_text(para, new_text)

# #         # ── Conduct paragraph ──────────────────────────────────
# #         elif "During" in text and "tenure" in text and "conduct" in text:
# #             new_text = (
# #                 f"During {pronoun} tenure with us as Intern "
# #                 f"{pronoun} conduct was {conduct}."
# #             )
# #             _set_paragraph_text(para, new_text)

# #         # ── Project & guide paragraph ──────────────────────────
# #         elif "The project undertaken was" in text or "project undertaken" in text:
# #             new_text = (
# #                 f'The project undertaken was “{project}” '
# #                 f"under the guidance of {guides}."
# #             )
# #             _set_paragraph_text(para, new_text)

# #         # ── Closing wish paragraph ─────────────────────────────
# #         elif "We wish" in text and "future endeavor" in text:
# #             new_text = (
# #                 f"We wish {pronoun} all the best in {pronoun} future endeavor. "
# #                 f"For Grasim Industries Ltd."
# #             )
# #             _set_paragraph_text(para, new_text)

# #         # ── Signatory name ─────────────────────────────────────
# #         elif text.strip() == "Sheba Banerjee":
# #             _set_paragraph_text(para, hr_name)

# #         # ── Signatory title + division ─────────────────────────
# #         elif "Head" in text and "Human Resources" in text:
# #             _set_paragraph_text(para, f"Head – Human Resources {hr_division}")

# #     # Write back
# #     modified_xml = etree.tostring(
# #         tree, xml_declaration=True, encoding="UTF-8", standalone=True
# #     )

# #     import tempfile
# #     tmp_path = out_path + ".tmp"
# #     with ZipFile(out_path, "r") as zin:
# #         with ZipFile(tmp_path, "w") as zout:
# #             for item in zin.infolist():
# #                 if item.filename == "word/document.xml":
# #                     zout.writestr(item, modified_xml)
# #                 else:
# #                     zout.writestr(item, zin.read(item.filename))

# #     os.replace(tmp_path, out_path)
# #     return f"/uploads/certificates/{filename}"



# """
# Offer Letter & Certificate generator using python-docx template substitution.

# Strategy: Use the real Grasim docx template (with exact logos, header, footer,
# fonts, margins) as the base. Substitute only the dynamic text nodes in the XML,
# leaving all formatting, images, and layout completely untouched.

# This produces a 100% layout-identical output to the original letter.
# """

# import os
# import re
# import copy
# import shutil
# from datetime import datetime
# from zipfile import ZipFile
# from lxml import etree
# from app.core.config import settings

# UPLOAD_DIR = settings.UPLOAD_DIR


# def _convert_docx_to_pdf(docx_path: str, out_dir: str):
#     """
#     Convert .docx to .pdf. Tries multiple methods in order:
#     1. docx2pdf (uses MS Word on Windows, LibreOffice on Linux/Mac)
#     2. LibreOffice CLI (Linux/Mac fallback)
#     3. soffice CLI (Windows LibreOffice fallback)
#     Returns pdf path or None if all methods fail.
#     """
#     import subprocess
#     pdf_path = os.path.join(out_dir, os.path.basename(docx_path).replace(".docx", ".pdf"))

#     # Method 1: docx2pdf — uses MS Word on Windows, LibreOffice on Linux/Mac
#     try:
#         from docx2pdf import convert
#         convert(docx_path, pdf_path)
#         if os.path.exists(pdf_path):
#             return pdf_path
#     except Exception:
#         pass

#     # Method 2: LibreOffice CLI (Linux/Mac)
#     for cmd in ["libreoffice", "soffice"]:
#         try:
#             result = subprocess.run(
#                 [cmd, "--headless", "--convert-to", "pdf", "--outdir", out_dir, docx_path],
#                 capture_output=True, text=True, timeout=60
#             )
#             if result.returncode == 0 and os.path.exists(pdf_path):
#                 return pdf_path
#         except (subprocess.TimeoutExpired, FileNotFoundError):
#             continue

#     return None

# TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "pdf", "templates")

# # Word XML namespace
# W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"


# def _ensure_dir(path: str):
#     os.makedirs(path, exist_ok=True)


# def _ordinal(n: int) -> str:
#     """Return ordinal string: 1 -> '1st', 2 -> '2nd', etc."""
#     if 10 <= n % 100 <= 20:
#         suffix = "th"
#     else:
#         suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
#     return f"{n}{suffix}"


# def _format_date_long(d) -> str:
#     """Format date as '20th May 2025'"""
#     if not d:
#         return ""
#     return f"{_ordinal(d.day)} {d.strftime('%B %Y')}"


# def _format_date_letter(d) -> str:
#     """Format date as '19-apr-2026' for the top of the letter"""
#     if not d:
#         return ""
#     return d.strftime("%d-%b-%Y").lower()


# def _get_full_text(paragraph_elem) -> str:
#     """Get concatenated text of all <w:t> elements in a paragraph."""
#     return "".join(
#         t.text or ""
#         for t in paragraph_elem.iter(f"{{{W}}}t")
#     )


# def _set_paragraph_text(paragraph_elem, new_text: str):
#     """
#     Replace all runs in a paragraph with a single run containing new_text,
#     preserving the formatting of the first run found.
#     """
#     ns = f"{{{W}}}"

#     # Find the first run to copy its formatting (rPr)
#     first_run = paragraph_elem.find(f"{ns}r")
#     first_rpr = None
#     if first_run is not None:
#         first_rpr = first_run.find(f"{ns}rPr")

#     # Remove all existing runs (but keep pPr)
#     for r in paragraph_elem.findall(f"{ns}r"):
#         paragraph_elem.remove(r)

#     # Create new run with preserved formatting
#     new_run = etree.SubElement(paragraph_elem, f"{ns}r")
#     if first_rpr is not None:
#         new_run.insert(0, copy.deepcopy(first_rpr))

#     new_t = etree.SubElement(new_run, f"{ns}t")
#     new_t.text = new_text
#     if new_text.startswith(" ") or new_text.endswith(" "):
#         new_t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")


# def _remove_paragraph(body_elem, paragraph_elem):
#     """Remove a paragraph element from body."""
#     body_elem.remove(paragraph_elem)


# def _insert_paragraph_after(body_elem, ref_elem, new_para_elem):
#     """Insert new_para_elem after ref_elem in body."""
#     idx = list(body_elem).index(ref_elem)
#     body_elem.insert(idx + 1, new_para_elem)


# def _make_text_paragraph(reference_para, text: str) -> etree.Element:
#     """Create a new paragraph element cloned from reference_para with given text."""
#     ns = f"{{{W}}}"
#     new_p = copy.deepcopy(reference_para)
#     # Clear all runs
#     for r in new_p.findall(f"{ns}r"):
#         new_p.remove(r)
#     # Add single run
#     first_run = reference_para.find(f"{ns}r")
#     first_rpr = None
#     if first_run is not None:
#         first_rpr = first_run.find(f"{ns}rPr")
#     new_run = etree.SubElement(new_p, f"{ns}r")
#     if first_rpr is not None:
#         new_run.insert(0, copy.deepcopy(first_rpr))
#     new_t = etree.SubElement(new_run, f"{ns}t")
#     new_t.text = text
#     if text and (text.startswith(" ") or text.endswith(" ")):
#         new_t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
#     return new_p


# async def generate_offer_letter_pdf(record) -> str:
#     """
#     Generate offer letter docx using the official Grasim template.
#     Returns the URL path to the generated file.
#     """
#     candidate = record.candidate
#     template_path = os.path.join(TEMPLATES_DIR, "offer_letter_template.docx")

#     if not os.path.exists(template_path):
#         raise FileNotFoundError(f"Offer letter template not found: {template_path}")

#     # Build substitution data
#     full_name = candidate.full_name if candidate else "Candidate"
#     first_name = full_name.split()[0] if full_name else "Candidate"
#     gender = candidate.gender if candidate else "male"
#     salutation = "Mr." if gender == "male" else "Ms."

#     institute = candidate.institute_name or ""
#     city = candidate.city or ""
#     state = candidate.state or ""
#     location = record.location or ""
#     duration_weeks = record.duration_weeks or ""

#     # Dates
#     letter_date = _format_date_letter(record.start_date or datetime.now())
#     start_str = _format_date_long(record.start_date)
#     end_str = _format_date_long(record.end_date)

#     # Stipend
#     has_stipend = record.stipend_amount and float(record.stipend_amount) > 0
#     stipend_str = f"Rs {int(record.stipend_amount):,}/- per month" if has_stipend else ""

#     # HR signatory — use letter_format from masters if configured
#     hr_name = settings.HR_HEAD_NAME
#     hr_title = settings.HR_HEAD_TITLE
#     hr_division = location

#     try:
#         from app.core.database import SessionLocal
#         from app.models.models import MasterData
#         db = SessionLocal()
#         try:
#             row = db.query(MasterData).filter(MasterData.id == 1).first()
#             if row and row.letter_formats:
#                 fmt = next(
#                     (f for f in row.letter_formats if f.get("department") == record.department),
#                     None
#                 )
#                 if fmt:
#                     hr_name = fmt.get("signatory", hr_name).split("\n")[0].strip()
#                     hr_division = fmt.get("department", hr_division)
#         finally:
#             db.close()
#     except Exception:
#         pass

#     # Copy template to working location
#     out_dir = os.path.join(UPLOAD_DIR, "offer_letters")
#     _ensure_dir(out_dir)
#     filename = f"offer_{record.id}.docx"
#     out_path = os.path.join(out_dir, filename)
#     shutil.copy2(template_path, out_path)

#     # Parse and modify document XML inside the docx zip
#     with ZipFile(out_path, "r") as zin:
#         doc_xml = zin.read("word/document.xml")

#     tree = etree.fromstring(doc_xml)
#     body = tree.find(f"{{{W}}}body")
#     paragraphs = body.findall(f"{{{W}}}p")

#     ns = f"{{{W}}}"

#     for para in paragraphs:
#         text = _get_full_text(para)

#         # ── Date line ─────────────────────────────────────────
#         if text.strip() == "Date":
#             _set_paragraph_text(para, letter_date)

#         # ── Salutation + Name (Mr./Ms. Full Name) ─────────────
#         elif text.strip() == "Name":
#             _set_paragraph_text(para, f"{salutation} {full_name}")

#         # ── College/Institute ──────────────────────────────────
#         elif text.strip() == "College Name":
#             _set_paragraph_text(para, institute)

#         # ── City / Location ────────────────────────────────────
#         elif text.strip() == "Location":
#             loc_text = city
#             if state:
#                 loc_text += f"\nDistrict- {state}"
#             _set_paragraph_text(para, loc_text)

#         # ── Dear Name ──────────────────────────────────────────
#         elif text.strip() == "Dear Name,":
#             _set_paragraph_text(para, f"Dear {first_name},")

#         # ── Body paragraph with duration/dates ─────────────────
#         elif "…………… weeks starting from" in text or "weeks starting from" in text:
#             # Rebuild this paragraph with dynamic content
#             new_body_text = (
#                 f"This is in regard to your request letter for internship with "
#                 f"Grasim Industries Ltd. (Grasim). We are pleased to inform you "
#                 f"that you have been accepted as an Intern for a period of "
#                 f"{duration_weeks} weeks starting from {start_str} to {end_str}."
#             )
#             # We need to handle the mixed formatting in this paragraph carefully
#             # Find and replace the full text while preserving runs structure
#             # Simplest: replace all runs with one run using first run's format
#             # The bold/italic on "at LOCATION" will be rebuilt if location exists
#             _set_paragraph_text(para, new_body_text)

#         # ── Stipend bullet ─────────────────────────────────────
#         elif "You will be paid a Stipend" in text:
#             if has_stipend:
#                 # Replace the amount while keeping the sentence structure
#                 # Rebuild with correct amount
#                 _set_paragraph_text(
#                     para,
#                     f"You will be paid a Stipend of {stipend_str}, inclusive of all taxes."
#                 )
#             else:
#                 # No stipend — remove this bullet paragraph entirely
#                 body.remove(para)

#         # ── Signatory name ─────────────────────────────────────
#         elif text.strip() == "Sheba Banerjee":
#             _set_paragraph_text(para, hr_name)

#         # ── Signatory division (MBDD) ──────────────────────────
#         elif text.strip() == "MBDD":
#             _set_paragraph_text(para, hr_division)

#     # Write modified XML back into the docx
#     modified_xml = etree.tostring(tree, xml_declaration=True, encoding="UTF-8", standalone=True)

#     # Repack the docx with modified document.xml
#     import tempfile
#     tmp_path = out_path + ".tmp"
#     with ZipFile(out_path, "r") as zin:
#         with ZipFile(tmp_path, "w") as zout:
#             for item in zin.infolist():
#                 if item.filename == "word/document.xml":
#                     zout.writestr(item, modified_xml)
#                 else:
#                     zout.writestr(item, zin.read(item.filename))

#     os.replace(tmp_path, out_path)
#     pdf_path = _convert_docx_to_pdf(out_path, out_dir)
#     if pdf_path:
#         return f"/uploads/offer_letters/{os.path.basename(pdf_path)}"
#     return f"/uploads/offer_letters/{filename}"


# async def generate_certificate_pdf(record, payload) -> str:
#     """
#     Generate experience certificate using the official Grasim certificate template.
#     Uses docx template substitution — preserves exact logo, layout, fonts, footer.
#     Returns the URL path to the generated .docx file.
#     """
#     candidate = record.candidate
#     template_path = os.path.join(TEMPLATES_DIR, "certificate_template.docx")

#     if not os.path.exists(template_path):
#         raise FileNotFoundError(f"Certificate template not found: {template_path}")

#     # Build all dynamic values
#     full_name  = candidate.full_name if candidate else "Candidate"
#     gender     = candidate.gender if candidate else "male"
#     salutation = "Mr." if gender == "male" else "Ms."
#     pronoun    = "his" if gender == "male" else "her"  # "during his/her tenure"

#     institute  = candidate.institute_name or ""
#     location   = record.location or ""
#     weeks      = record.duration_weeks or ""
#     conduct    = payload.conduct_remark.lower()  # "good", "excellent", etc.
#     project    = payload.project_title
#     guides     = payload.guide_names

#     # Dates — ordinal format: "20th May 2025"
#     start_str = _format_date_long(record.start_date)
#     end_str   = _format_date_long(record.end_date)

#     # Issue date — "July 28, 2025" format (matches original)
#     issue_date = payload.issue_date
#     issue_str  = issue_date.strftime("%B") + " " + str(issue_date.day) + ", " + str(issue_date.year)

#     # HR signatory
#     hr_name     = settings.HR_HEAD_NAME
#     hr_division = location
#     try:
#         from app.core.database import SessionLocal
#         from app.models.models import MasterData
#         db = SessionLocal()
#         try:
#             row = db.query(MasterData).filter(MasterData.id == 1).first()
#             if row and row.letter_formats:
#                 fmt = next(
#                     (f for f in row.letter_formats if f.get("department") == record.department),
#                     None
#                 )
#                 if fmt:
#                     hr_name     = fmt.get("signatory", hr_name).split("\n")[0].strip()
#                     hr_division = fmt.get("department", hr_division)
#         finally:
#             db.close()
#     except Exception:
#         pass

#     # Copy template
#     out_dir  = os.path.join(UPLOAD_DIR, "certificates")
#     _ensure_dir(out_dir)
#     filename = f"cert_{record.id}.docx"
#     out_path = os.path.join(out_dir, filename)
#     shutil.copy2(template_path, out_path)

#     # Parse document XML
#     with ZipFile(out_path, "r") as zin:
#         doc_xml = zin.read("word/document.xml")

#     tree = etree.fromstring(doc_xml)
#     body = tree.find(f"{{{W}}}body")
#     paragraphs = body.findall(f"{{{W}}}p")

#     for para in paragraphs:
#         text = _get_full_text(para)

#         # ── Issue date (top of letter) ─────────────────────────
#         if text.strip() in ("July 28, 2025", "July 28,2025") or (
#             "2025" in text and len(text.strip()) < 20 and
#             any(m in text for m in ["January","February","March","April","May","June",
#                                      "July","August","September","October","November","December"])
#         ):
#             _set_paragraph_text(para, issue_str)

#         # ── Main certify paragraph ─────────────────────────────
#         elif "This is to certify that" in text:
#             # Build: "This is to certify that Mr. Niket Totala, a student of VJTI, Mumbai
#             #          has successfully completed his Internship at TRADC
#             #          (Grasim Industries Limited), for the period of 8 weeks
#             #          starting from 20th May 2025 to 18th July 2025."
#             new_text = (
#                 f"This is to certify that {salutation} {full_name}, "
#                 f"a student of {institute} has successfully completed "
#                 f"{pronoun} Internship at {location} (Grasim Industries Limited), "
#                 f"for the period of {weeks} weeks starting from "
#                 f"{start_str} to {end_str}."
#             )
#             _set_paragraph_text(para, new_text)

#         # ── Conduct paragraph ──────────────────────────────────
#         elif "During" in text and "tenure" in text and "conduct" in text:
#             new_text = (
#                 f"During {pronoun} tenure with us as Intern "
#                 f"{pronoun} conduct was {conduct}."
#             )
#             _set_paragraph_text(para, new_text)

#         # ── Project & guide paragraph ──────────────────────────
#         elif "The project undertaken was" in text or "project undertaken" in text:
#             new_text = (
#                 f'The project undertaken was “{project}” '
#                 f"under the guidance of {guides}."
#             )
#             _set_paragraph_text(para, new_text)

#         # ── Closing wish paragraph ─────────────────────────────
#         elif "We wish" in text and "future endeavor" in text:
#             new_text = (
#                 f"We wish {pronoun} all the best in {pronoun} future endeavor. "
#                 f"For Grasim Industries Ltd."
#             )
#             _set_paragraph_text(para, new_text)

#         # ── Signatory name ─────────────────────────────────────
#         elif text.strip() == "Sheba Banerjee":
#             _set_paragraph_text(para, hr_name)

#         # ── Signatory title + division ─────────────────────────
#         elif "Head" in text and "Human Resources" in text:
#             _set_paragraph_text(para, f"Head – Human Resources {hr_division}")

#     # Write back
#     modified_xml = etree.tostring(
#         tree, xml_declaration=True, encoding="UTF-8", standalone=True
#     )

#     import tempfile
#     tmp_path = out_path + ".tmp"
#     with ZipFile(out_path, "r") as zin:
#         with ZipFile(tmp_path, "w") as zout:
#             for item in zin.infolist():
#                 if item.filename == "word/document.xml":
#                     zout.writestr(item, modified_xml)
#                 else:
#                     zout.writestr(item, zin.read(item.filename))

#     os.replace(tmp_path, out_path)
#     pdf_path = _convert_docx_to_pdf(out_path, out_dir)
#     if pdf_path:
#         return f"/uploads/certificates/{os.path.basename(pdf_path)}"
#     return f"/uploads/certificates/{filename}"



"""
Offer Letter & Certificate — pixel-perfect ReportLab PDF.
Matches docx template exactly based on full XML + visual analysis.

Key corrections from visual comparison:
 1. Font: Arial (not Times-Roman) — Normal style uses Arial
 2. "PULP & FIBRE BUSINESS": Tahoma Bold 8pt
 3. "Do note..." is Bold + Italic + Underline (not just Bold)
 4. Bullets: large filled circle (•) with hanging indent 22.5pt, no extra gap between items
 5. Footer: Birla Cellulose logo (EMF image) above company name in footer
 6. "Sensitivity: General" is at the very bottom of footer (below address lines)
 7. Declaration: Place / blank line / Date / blank line / Name+Signature on separate lines
 8. Header rule is a bottom border on the header paragraph (not a body line)
 9. No HR line above Declaration — just empty paragraphs creating space
10. Encl lines not indented with &nbsp; — just plain text with space
"""

import os
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image,
    Table, TableStyle, HRFlowable, ListFlowable, ListItem
)

from app.core.config import settings

UPLOAD_DIR    = settings.UPLOAD_DIR
TEMPLATES_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "pdf", "templates"
)
LOGO_PATH      = os.path.join(TEMPLATES_DIR, "grasim_logo.jpeg")
SIGNATURE_PATH = os.path.join(TEMPLATES_DIR, "signature.png")

# ── Page geometry (from docx sectPr twips ÷ 20 = pt) ─────────────────────────
PAGE_W, PAGE_H = A4
ML   = 78.0    # left  1560 twips
MR   = 71.0    # right 1419 twips
MT   = 105.75  # top   2115 twips
MB   = 105.0   
HEADER_DIST = 13.7   # 274 twips
FOOTER_DIST = 82.75  # 1655 twips

# Logo exact EMU from docx header
LOGO_W  = (922655 / 914400) * 72   # 72.65 pt
LOGO_H  = (906145 / 914400) * 72   # 71.35 pt
LOGO_CX = PAGE_W / 2

# Signature exact EMU from docx body
SIG_W = (1444530 / 914400) * 72    # 113.9 pt
SIG_H = (800100  / 914400) * 72    # 63.1  pt

# ── Fonts ─────────────────────────────────────────────────────────────────────
FONT      = "Helvetica"       # Arial → Helvetica (built-in PDF equivalent)
FONT_BOLD = "Helvetica-Bold"
FONT_BI   = "Helvetica-BoldOblique"  # Bold+Italic for "Do note"
FONT_I    = "Helvetica-Oblique"
FONT_HDR  = "Helvetica-Bold"  # Tahoma → Helvetica-Bold for header label
FS        = 11    # PlainText style body
FS_NORM   = 12    # Normal style (not used much)
FS_SM     = 8     # footer small
FS_CO     = 10    # footer company name first line
BLACK     = HexColor("#000000")


def _s(name, **kw):
    base = dict(
        fontName=FONT, fontSize=FS, leading=FS * 1.5,
        textColor=BLACK, spaceBefore=0, spaceAfter=0,
    )
    base.update(kw)
    return ParagraphStyle(name, **base)


def _styles():
    return dict(
        n    = _s("n",    alignment=TA_JUSTIFY),
        c    = _s("c",    alignment=TA_CENTER),
        l    = _s("l",    alignment=TA_LEFT),
        blt  = _s("blt",  alignment=TA_JUSTIFY,
                  leftIndent=22.5, firstLineIndent=-22.5),
        sml  = _s("sml",  fontSize=FS_SM,  leading=FS_SM*1.4,  alignment=TA_LEFT),
        smc  = _s("smc",  fontSize=FS_SM,  leading=FS_SM*1.4,  alignment=TA_CENTER),
        smco = _s("smco", fontSize=FS_CO,  leading=FS_CO*1.4,  alignment=TA_CENTER),
    )


def _ensure_dir(p): os.makedirs(p, exist_ok=True)

def _ordinal(n):
    sfx = "th" if 10 <= n % 100 <= 20 else {1:"st",2:"nd",3:"rd"}.get(n%10,"th")
    return f"{n}{sfx}"

def _fmt_long(d):
    return f"{_ordinal(d.day)} {d.strftime('%B %Y')}" if d else ""

def _fmt_letter(d):
    return d.strftime("%d-%b-%Y") if d else ""

def _get_hr_signatory(record):
    hr_name = settings.HR_HEAD_NAME
    hr_div  = record.location or ""
    try:
        from app.core.database import SessionLocal
        from app.models.models import MasterData
        db = SessionLocal()
        try:
            row = db.query(MasterData).filter(MasterData.id == 1).first()
            if row and row.letter_formats:
                fmt = next((f for f in row.letter_formats
                            if f.get("department") == record.department), None)
                if fmt:
                    hr_name = fmt.get("signatory", hr_name).split("\n")[0].strip()
                    hr_div  = fmt.get("department", hr_div)
        finally:
            db.close()
    except Exception:
        pass
    return hr_name, hr_div


# ── Header / Footer callback ───────────────────────────────────────────────────
def _hf_callback(logo_path, division):
    def draw(c, doc):
        c.saveState()

        # ── HEADER ────────────────────────────────────────────────────────────
        header_zone_h = MT - HEADER_DIST
        logo_y = PAGE_H - HEADER_DIST - (header_zone_h + LOGO_H) / 2 + 4

        if os.path.exists(logo_path):
            c.drawImage(
                logo_path, LOGO_CX - LOGO_W / 2, logo_y,
                width=LOGO_W, height=LOGO_H,
                preserveAspectRatio=True, mask="auto"
            )

        # "PULP & FIBRE BUSINESS" — Tahoma Bold 8pt centred
        c.setFont(FONT_HDR, 8)
        c.setFillColor(BLACK)
        c.drawCentredString(PAGE_W / 2, logo_y - 11, division.upper())

        # Bottom border on header (thin line at body top)
        # c.setStrokeColor(BLACK)
        # c.setLineWidth(0.5)
        # c.line(ML, PAGE_H - MT + 4, PAGE_W - MR, PAGE_H - MT + 4)

        # ── FOOTER ────────────────────────────────────────────────────────────
        # Footer zone starts at MB from bottom
        # Structure (top to bottom):
        #   thin rule
        #   [Birla Cellulose logo - EMF, we skip/approximate]
        #   "Grasim Industries Limited (Pulp & Fibre Business)" 10pt orange/dark
        #   address lines 8pt
        #   "Sensitivity: General" very bottom

        footer_top = MB - 2
        # c.setStrokeColor(BLACK)
        # c.setLineWidth(0.5)
        # c.line(ML, footer_top, PAGE_W - MR, footer_top)

        # Birla Cellulose logo — centred above company name
        BIRLA_LOGO = os.path.join(TEMPLATES_DIR, "birla_cellulose_logo.png")
        BIRLA_W = 50.0   # pt  (~0.69 inch, matching docx footer visual)
        BIRLA_H = 54.0   # pt  (aspect ratio of cropped logo)
        if os.path.exists(BIRLA_LOGO):
            c.drawImage(
                BIRLA_LOGO,
                LOGO_CX - BIRLA_W / 2,
                footer_top - 4 - BIRLA_H,
                width=BIRLA_W, height=BIRLA_H,
                preserveAspectRatio=True, mask="auto"
            )
            co_base = footer_top - 4 - BIRLA_H - 12
        else:
            co_base = footer_top - 13

        # Company name in reddish-brown color (from docx footer color)
        FOOTER_CO_COLOR = HexColor("#C0392B")  # dark red matching Birla Cellulose branding
        c.setFont(FONT_BOLD, FS_CO)
        c.setFillColor(FOOTER_CO_COLOR)
        co_y = co_base
        c.drawCentredString(PAGE_W / 2, co_y,
                            "Grasim Industries Limited (Pulp & Fibre Business)")

        # Address lines
        c.setFont(FONT, FS_SM)
        c.setFillColor(BLACK)
        lines = [
            "Unit 501/A, 502, 5th Floor, Hubtown Solaris, Prof. N.S. Phadke Marg,"
            " Vijay Nagar, Andheri (E), Mumbai 400069, India",
            "T: + 91 2261957700  |  F: + 91 2261957702  |"
            "  E: birlacellulose@adityabirla.com  |  W: www.birlacellulose.com",
            f"Corporate ID No. : {settings.COMPANY_CIN}",
        ]
        line_y = co_y - 10
        for line in lines:
            c.drawCentredString(PAGE_W / 2, line_y, line)
            line_y -= 9

        # "Sensitivity: General" at very bottom left
        c.setFont(FONT, 7.5)
        c.setFillColor(BLACK)
        c.drawString(ML, line_y - 4, "Sensitivity: General")

        c.restoreState()
    return draw


# ── Offer Letter ──────────────────────────────────────────────────────────────
async def generate_offer_letter_pdf(record) -> str:
    cand = record.candidate

    full_name  = cand.full_name if cand else "Candidate"
    first_name = full_name.split()[0] if full_name else "Candidate"
    gender     = (cand.gender if cand else "male") or "male"
    sal        = "Mr." if gender.lower() == "male" else "Ms."

    institute  = cand.institute_name or ""
    city       = cand.city or ""
    state      = cand.state or ""
    location   = record.location or ""
    weeks      = record.duration_weeks or ""

    ldate   = _fmt_letter(record.start_date or datetime.now())
    start_s = _fmt_long(record.start_date)
    end_s   = _fmt_long(record.end_date)

    has_stip = record.stipend_amount and float(record.stipend_amount) > 0
    stip_s   = f"Rs {int(record.stipend_amount):,}/- per month" if has_stip else ""

    hr_name, hr_div = _get_hr_signatory(record)
    co = settings.COMPANY_NAME

    out_dir  = os.path.join(UPLOAD_DIR, "offer_letters")
    _ensure_dir(out_dir)
    filename = f"offer_{record.id}.pdf"
    out_path = os.path.join(out_dir, filename)

    S  = _styles()
    cb = _hf_callback(LOGO_PATH, hr_div or settings.COMPANY_DIVISION)

    doc = SimpleDocTemplate(
        out_path, pagesize=A4,
        leftMargin=ML, rightMargin=MR,
        topMargin=MT, bottomMargin=MB,
        title=f"Offer Letter – {full_name}",
    )

    def sp(h=12): return Spacer(1, h)

    story = []

    # Date
    story.append(Paragraph(ldate, S["n"]))
    story.append(sp(12))

    # Addressee block
    story.append(Paragraph(f"{sal} {full_name}", S["n"]))
    story.append(Paragraph(institute, S["n"]))
    addr = city
    if state:
        addr += f"<br/>District- {state}"
    story.append(Paragraph(addr, S["n"]))
    story.append(sp(12))

    # Subject — bold
    story.append(Paragraph(
        f"<b>Sub: Regarding your application for Internship with {co}</b>",
        S["n"]))
    story.append(sp(12))

    # Salutation
    story.append(Paragraph(f"Dear {first_name},", S["n"]))
    story.append(sp(12))

    # Body paragraph 1
    story.append(Paragraph(
        f"This is in regard to your request letter for internship with {co} at "
        f"<b>{location}</b>. We are pleased to inform you that you have been accepted "
        f"as an Intern for a period of {weeks} weeks starting from "
        f"<b>{start_s}</b> to <b>{end_s}</b>.",
        S["n"]))
    story.append(sp(12))

    # Body paragraph 2
    story.append(Paragraph(
        f"During the Internship you shall be bound by all terms and conditions "
        f"attached in Annexure A and Annexure B with this letter. You shall further "
        f"be bound by all such internal policies of {co} and such changes as may be "
        f"informed to you from time to time.",
        S["n"]))
    story.append(sp(12))

    # "Do note" — Bold + Italic + Underline
    story.append(Paragraph(
        f"<b><i><u>Do note that this is not an employment offer.</u></i></b>",
        S["n"]))
    story.append(sp(12))

    story.append(Paragraph(
        "The following additional terms &amp; conditions will be applicable to you "
        "during the Internship:",
        S["n"]))
    story.append(sp(6))

    # Bullet list — large bullet, hanging indent matching docx
    bullets = [
        "You will Work from office for the Project assigned to you.",
        "You may have to Visit the customers / vendors, based on the requirement of the Project.",
    ]
    if has_stip:
        bullets.append(
            f"You will be paid a Stipend of <b>{stip_s}</b>, inclusive of all taxes.")
    bullets += [
        f"If there is a requirement for you to travel to complete your Project, {co} "
        f"will reimburse the travel expenses as per the original bills and in accordance "
        f"with the travel policy of {co}. Any travel during the term of your Internship "
        f"shall be arranged for by you. {co} shall not be held responsible in case of "
        f"any untoward event / incident during travel.",
        "You shall arrange for your own accommodation during the Internship tenure.",
        f"The certificate for the project completion will be issued on the submission of "
        f"the project report to the undersigned. Please take note that this internship is "
        f"permitted only as it is a part of the curriculum. After the completion of "
        f"internship, {co} is not liable to offer the student any type of employment.",
        "This engagement is subject to you signing Annexure A and Annexure B attached "
        "with this letter and returning a copy of the same to us.",
    ]

    blt_style = _s("blt2", alignment=TA_JUSTIFY,
                   leftIndent=22.5, firstLineIndent=0, spaceAfter=0)
    for b in bullets:
        story.append(Paragraph(f"\u2022\u00a0\u00a0{b}", blt_style))

    story.append(sp(12))

    story.append(Paragraph(
        "Please countersign the duplicate copy of this offer letter and return to us "
        "as a token of your acceptance.",
        S["n"]))
    story.append(sp(12))

    story.append(Paragraph("Yours faithfully,", S["n"]))
    story.append(sp(6))

    # Signature image
    if os.path.exists(SIGNATURE_PATH):
        sig = Image(SIGNATURE_PATH, width=SIG_W, height=SIG_H)
        sig.hAlign = "LEFT"
        story.append(sig)
    else:
        story.append(sp(SIG_H))

    # Signatory — bold
    story.append(Paragraph(f"<b>{hr_name}</b>", S["n"]))
    story.append(Paragraph(f"<b>{settings.HR_HEAD_TITLE}</b>", S["n"]))
    story.append(Paragraph(f"<b>{hr_div or settings.COMPANY_DIVISION}</b>", S["n"]))

    story.append(sp(24))  # blank lines before Encl

    # Enclosures — plain, matching docx
    story.append(Paragraph(
        "Encl: (i)  Annexure A: General terms and conditions", S["n"]))
    story.append(Paragraph(
        "         (ii) Annexure B: Declaration and indemnity", S["n"]))

    story.append(sp(24))  # blank lines before Declaration

    # DECLARATION — centered, no HR line (docx uses blank paragraphs only)
    story.append(Paragraph("DECLARATION", S["c"]))
    story.append(sp(12))

    story.append(Paragraph(
        "I hereby declare and affirm that I have carefully studied and understood the "
        "terms and conditions of my internship herein above detailed and specifically "
        "mentioned in Annexure A and Annexure B. I accept the said internship and I "
        "hereby undertake to abide myself of the said terms and conditions.",
        S["n"]))

    # Declaration fields — each on its own line with underline space, matching docx
    story.append(sp(12))
    story.append(Paragraph("Place:", S["n"]))
    story.append(sp(12))
    story.append(Paragraph("Date:", S["n"]))
    story.append(sp(12))

    # Name of University + Signature on same line (tab-spaced in docx)
    sig_line_tbl = Table(
    [["Name of the University:", "", "Signature", ""]],
    colWidths=[1.8*72, 1.5*72, 0.9*72, 1.5*72]
)
    # sig_line_tbl.setStyle(TableStyle([
    #     ("FONTNAME",     (0,0), (-1,-1), FONT),
    #     ("FONTSIZE",     (0,0), (-1,-1), FS),
    #     ("VALIGN",       (0,0), (-1,-1), "BOTTOM"),
    #     ("TOPPADDING",   (0,0), (-1,-1), 0),
    #     ("BOTTOMPADDING",(0,0), (-1,-1), 0),
    #     ("LEFTPADDING",  (0,0), (-1,-1), 0),
    #     ("RIGHTPADDING", (0,0), (-1,-1), 2),
    # ]))
    story.append(sig_line_tbl)

    doc.build(story, onFirstPage=cb, onLaterPages=cb)
    return f"/uploads/offer_letters/{filename}"


# ── Experience Certificate ────────────────────────────────────────────────────
async def generate_certificate_pdf(record, payload) -> str:
    cand = record.candidate

    full_name   = cand.full_name if cand else "Candidate"
    gender      = (cand.gender if cand else "male") or "male"
    sal         = "Mr." if gender.lower() == "male" else "Ms."
    pronoun     = "his" if gender.lower() == "male" else "her"
    pronoun_obj = "him" if gender.lower() == "male" else "her"

    institute = cand.institute_name or ""
    location  = record.location or ""
    weeks     = record.duration_weeks or ""
    conduct   = payload.conduct_remark.lower()
    project   = payload.project_title
    guides    = payload.guide_names

    start_s = _fmt_long(record.start_date)
    end_s   = _fmt_long(record.end_date)

    issue_date = payload.issue_date
    issue_s = (
        issue_date.strftime("%B") + " " +
        str(issue_date.day) + ", " +
        str(issue_date.year)
    )

    hr_name, hr_div = _get_hr_signatory(record)
    co = settings.COMPANY_NAME

    out_dir  = os.path.join(UPLOAD_DIR, "certificates")
    _ensure_dir(out_dir)
    filename = f"cert_{record.id}.pdf"
    out_path = os.path.join(out_dir, filename)

    S  = _styles()
    cb = _hf_callback(LOGO_PATH, hr_div or settings.COMPANY_DIVISION)

    doc = SimpleDocTemplate(
        out_path, pagesize=A4,
        leftMargin=ML, rightMargin=MR,
        topMargin=MT, bottomMargin=MB,
        title=f"Experience Certificate – {full_name}",
    )

    def sp(h=12): return Spacer(1, h)
    story = []

    story.append(Paragraph(f"<b>{issue_s}</b>", S["n"]))
    story.append(sp(12))
    story.append(Paragraph("<b><u>To whomsoever it may concern</u></b>", S["n"]))
    story.append(sp(12))
    story.append(Paragraph(
        f"This is to certify that <b>{sal} {full_name}</b>, a student of {institute} "
        f"has successfully completed {pronoun} Internship at "
        f"{hr_div or location} ({co}), for the period of {weeks} weeks starting "
        f"from {start_s} to {end_s}.", S["n"]))
    story.append(sp(12))
    story.append(Paragraph(
        f"During {pronoun} tenure with us as Intern {pronoun} conduct was "
        f"<b>{conduct}</b>.", S["n"]))
    story.append(sp(12))
    story.append(Paragraph(
        f"The project undertaken was <b>&#34;{project}&#34;</b> under the guidance "
        f"of <b>{guides}</b>.", S["n"]))
    story.append(sp(12))
    story.append(Paragraph(
        f"We wish {pronoun_obj} all the best in {pronoun} future endeavor.", S["n"]))
    story.append(sp(6))
    story.append(Paragraph(f"For {co}", S["n"]))
    story.append(sp(6))

    if os.path.exists(SIGNATURE_PATH):
        sig = Image(SIGNATURE_PATH, width=SIG_W, height=SIG_H)
        sig.hAlign = "LEFT"
        story.append(sig)
    else:
        story.append(sp(SIG_H))

    story.append(Paragraph(f"<b>{hr_name}</b>", S["n"]))
    story.append(Paragraph(f"<b>{settings.HR_HEAD_TITLE}</b>", S["n"]))
    story.append(Paragraph(f"<b>{hr_div or settings.COMPANY_DIVISION}</b>", S["n"]))

    doc.build(story, onFirstPage=cb, onLaterPages=cb)
    return f"/uploads/certificates/{filename}"