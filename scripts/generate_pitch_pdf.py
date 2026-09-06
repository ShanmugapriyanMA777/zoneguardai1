import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Header line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.75)
        self.line(40, 755, 572, 755)
        self.drawString(40, 760, "ZoneGuard AI — Official 90-Second Presentation & Demo Script")
        self.drawRightString(572, 760, "TNDMA / SIH 2026 Pitch Document")

        # Footer line
        self.line(40, 42, 572, 42)
        self.drawString(40, 30, "CONFIDENTIAL & PROPRIETARY — ZoneGuard AI Multi-Hazard Intelligence")
        self.drawRightString(572, 30, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=45,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=10
    )

    badge_style = ParagraphStyle(
        'MetaBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#059669')
    )

    sec_title = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=8,
        spaceAfter=3
    )

    cue_style = ParagraphStyle(
        'VisualCue',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=4
    )

    dialogue_style = ParagraphStyle(
        'SpokenDialogue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#1e293b')
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#ffffff')
    )

    story = []

    # Title & Header
    story.append(Paragraph("ZoneGuard AI", title_style))
    story.append(Paragraph("<b>90-Second Demo & Pitch Presentation Script</b> — National Multi-Hazard Red-Zone Mapping & Pre-Disaster Relocation Intelligence", subtitle_style))
    
    # Metadata Pill Box
    meta_data = [[
        Paragraph("<b>Target Duration:</b> 90 Seconds (1.5 Mins)", badge_style),
        Paragraph("<b>Word Count:</b> ~215 Words", badge_style),
        Paragraph("<b>Pace:</b> ~140 WPM (Clear & Authoritative)", badge_style)
    ]]
    meta_table = Table(meta_data, colWidths=[180, 160, 192])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
        ('BORDER', (0,0), (-1,-1), 1, colors.HexColor('#86efac')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # SECTION 1
    story.append(Paragraph("<b>1. [0:00 – 0:15] The Hook & The Problem</b>", sec_title))
    cue1 = Paragraph("<b>🖥️ Visual Action:</b> Open Landing Page dashboard; highlight live red-zone casualty counters and high-risk alerts.", cue_style)
    speech1 = Paragraph("<i>\"Every monsoon, vulnerable communities across fragile terrains like the Western Ghats face catastrophic landslides and land subsidence with zero early warning. Traditional disaster management only reacts <b>after</b> tragedy strikes. What if we could detect sub-surface land movement months in advance and relocate people <b>before</b> a disaster occurs?\"</i>", dialogue_style)
    
    t1 = Table([[cue1], [speech1]], colWidths=[532])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#eff6ff')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t1)
    story.append(Spacer(1, 8))

    # SECTION 2
    story.append(Paragraph("<b>2. [0:15 – 0:40] Satellite Radar Fusion & Real-Time Monitoring</b>", sec_title))
    cue2 = Paragraph("<b>🖥️ Visual Action:</b> Switch to GIS Command Center, navigate into Tamil Nadu red zones (e.g. Coonoor or Courtallam), and show multi-satellite radar HUD.", cue_style)
    speech2 = Paragraph("<i>\"Introducing <b>ZoneGuard AI</b> — a National Multi-Hazard Red-Zone Mapping and Pre-Disaster Relocation Intelligence System.<br/><br/>We continuously fuse Earth Observation satellites: <b>Copernicus Sentinel-1 SAR</b> detects microscopic ground creep at millimeter precision using PSInSAR interferometry, combined with <b>ISRO Cartosat DEM</b> for slope shear and <b>Landsat multispectral data</b> for soil saturation.\"</i>", dialogue_style)
    
    t2 = Table([[cue2], [speech2]], colWidths=[532])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#eff6ff')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t2)
    story.append(Spacer(1, 8))

    # SECTION 3
    story.append(Paragraph("<b>3. [0:40 – 1:05] TreeSHAP Explainable AI & Smart Relocation Engine</b>", sec_title))
    cue3 = Paragraph("<b>🖥️ Visual Action:</b> Click 'Explain AI' (TreeSHAP modal), then click the green [Match Relocation Site →] button. Watch the map route corridor and haven appear with celebration confetti.", cue_style)
    speech3 = Paragraph("<i>\"With <b>TreeSHAP Explainable AI</b>, disaster officers don't just see an arbitrary risk score — they see exactly <b>why</b> a zone is failing.<br/><br/>With one click, our <b>Analytical Hierarchy Process (AHP)</b> engine pairs the compromised community with the safest relocation haven. It dynamically verifies carrying capacity, calculates evacuation corridors, and charts the safest transit route.\"</i>", dialogue_style)
    
    t3 = Table([[cue3], [speech3]], colWidths=[532])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#eff6ff')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t3)
    story.append(Spacer(1, 8))

    # SECTION 4
    story.append(Paragraph("<b>4. [1:05 – 1:30] Ground Ops, Field Verification & Closing Impact</b>", sec_title))
    cue4 = Paragraph("<b>🖥️ Visual Action:</b> Toggle to Deformation Explorer showing dynamic PSInSAR displacement curves, then click 'Decision PDF' to demonstrate auditable export.", cue_style)
    speech4 = Paragraph("<i>\"From district collectors generating legally auditable relocation directives to ground officers on the front lines, ZoneGuard AI shifts disaster response from reactive relief to proactive protection.<br/><br/><b>ZoneGuard AI — Mapping invisible hazards, safeguarding human lives.</b>\"</i>", dialogue_style)
    
    t4 = Table([[cue4], [speech4]], colWidths=[532])
    t4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#eff6ff')),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t4)
    story.append(Spacer(1, 10))

    # PRESENTER CHEATSHEET TABLE
    story.append(Paragraph("<b>📋 Presenter Quick-Reference Timeline</b>", sec_title))
    summary_data = [
        [
            Paragraph("Timestamp", table_header),
            Paragraph("Phase", table_header),
            Paragraph("Live Screen Action", table_header),
            Paragraph("Key Talking Point", table_header)
        ],
        [
            Paragraph("<b>0:00 – 0:15</b>", table_cell),
            Paragraph("The Problem", table_cell),
            Paragraph("Landing Page & Red-Zone Counters", table_cell),
            Paragraph("Shift from reactive relief to pre-disaster prediction", table_cell)
        ],
        [
            Paragraph("<b>0:15 – 0:40</b>", table_cell),
            Paragraph("Satellite Pipeline", table_cell),
            Paragraph("GIS Command Center + Live Radar", table_cell),
            Paragraph("Sentinel-1 PSInSAR mm creep + ISRO Cartosat DEM", table_cell)
        ],
        [
            Paragraph("<b>0:40 – 1:05</b>", table_cell),
            Paragraph("Core AI Demo", table_cell),
            Paragraph("TreeSHAP → Match Relocation Site", table_cell),
            Paragraph("Explainable drivers & automated AHP haven routing", table_cell)
        ],
        [
            Paragraph("<b>1:05 – 1:30</b>", table_cell),
            Paragraph("Impact & Close", table_cell),
            Paragraph("InSAR Curve & Decision PDF Modal", table_cell),
            Paragraph("District legal directives & saving human lives", table_cell)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[65, 75, 182, 210])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#ffffff'), colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(summary_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generated successfully at {filename}")

if __name__ == '__main__':
    out_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(out_dir)
    pdf_path = os.path.join(root_dir, "ZoneGuard_AI_Pitch_Script.pdf")
    build_pdf(pdf_path)
