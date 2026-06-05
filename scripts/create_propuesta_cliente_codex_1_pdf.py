from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "docs" / "PROPUESTA-CLIENTE-CODEX-1.pdf"


def money(value: str) -> str:
    return value



def add_scope_table(story, body_compact, table_text):
    scope_data = [
        [Paragraph("<b>Área</b>", table_text), Paragraph("<b>Funcionalidad</b>", table_text)],
        [Paragraph("Contactos", table_text), Paragraph("Directorio, alta guiada, detalle, foto, asignación por agente", table_text)],
        [Paragraph("Pólizas", table_text), Paragraph("Vida y auto, vencimientos, renovaciones, archivos PDF", table_text)],
        [Paragraph("Pensiones", table_text), Paragraph("Asesoría y trámites (IMSS Ley 73 / AFORE Ley 97)", table_text)],
        [Paragraph("Trámites vehiculares", table_text), Paragraph("Alta, baja, placas, cotización, checklist documental", table_text)],
        [Paragraph("Pipeline", table_text), Paragraph("Tablero Kanban por etapas, prioridad, probabilidad de cierre", table_text)],
        [Paragraph("Calendario", table_text), Paragraph("Eventos, recordatorios y alertas operativas", table_text)],
        [Paragraph("Bitácora", table_text), Paragraph("Historial de llamadas, WhatsApp, visitas y notas", table_text)],
        [Paragraph("Finanzas", table_text), Paragraph("Pagos vinculados a pólizas, resumen de cobranza", table_text)],
        [Paragraph("Panel de control", table_text), Paragraph("Indicadores de cartera, renovaciones y alertas", table_text)],
        [Paragraph("Usuarios", table_text), Paragraph("Roles administrador y operativo", table_text)],
    ]
    scope_table = Table(scope_data, colWidths=[1.85 * inch, 4.75 * inch], hAlign="LEFT")
    scope_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#DADCE0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#DADCE0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
            ]
        )
    )
    story.append(scope_table)
    story.append(Spacer(1, 8))

def build_doc() -> None:
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "ProposalTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0B2545"),
        spaceAfter=4,
    )
    subtitle = ParagraphStyle(
        "ProposalSubtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#555555"),
        spaceAfter=12,
    )
    h1 = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading1"],
        fontName="Helvetica",
        fontSize=15,
        leading=18,
        textColor=colors.HexColor("#2E74B5"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body = ParagraphStyle(
        "BodyProposal",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        alignment=TA_LEFT,
        textColor=colors.black,
        spaceAfter=8,
    )
    body_compact = ParagraphStyle(
        "BodyCompact",
        parent=body,
        spaceAfter=4,
    )
    table_text = ParagraphStyle(
        "TableText",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=12,
        textColor=colors.black,
    )

    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        leftMargin=inch,
        rightMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
        title="PROPUESTA-CLIENTE-CODEX-1",
        author="Codex",
        subject="Propuesta comercial CRM SaaS para 2 usuarios",
    )

    story = []

    story.append(Paragraph("PROPUESTA COMERCIAL", title))
    story.append(Paragraph("CRM SaaS para agencia de seguros con 2 usuarios activos", subtitle))

    meta_data = [
        [
            Paragraph("<b>Cliente</b>", table_text),
            Paragraph("Propuesta comercial", table_text),
        ],
        [
            Paragraph("<b>Fecha</b>", table_text),
            Paragraph(date.today().strftime("%d/%m/%Y"), table_text),
        ],
        [
            Paragraph("<b>Versión</b>", table_text),
            Paragraph("1.1", table_text),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[1.65 * inch, 4.85 * inch], hAlign="LEFT")
    meta_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F2F4F7")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#DADCE0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#DADCE0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(meta_table)
    story.append(Spacer(1, 12))

    story.append(
        Paragraph(
            "Esta propuesta presenta una implementación inicial y una renta mensual pensada para una agencia pequeña que "
            "necesita un CRM a medida, con acceso para 2 usuarios, autenticación, carga de archivos, hosting incluido y despliegue administrado.",
            body,
        )
    )

    story.append(Paragraph("1. Alcance del sistema", h1))
    story.append(Paragraph("El servicio considera la plataforma lista para operar con los módulos principales:", body_compact))
    add_scope_table(story, body_compact, table_text)

    story.append(Paragraph("2. Inversión propuesta", h1))
    story.append(
        Paragraph(
            "La propuesta está pensada para ser accesible en una primera etapa, sin perder margen operativo "
            "para soporte, mantenimiento, hosting y mejoras menores.",
            body,
        )
    )

    pricing_data = [
        [Paragraph("<b>Concepto</b>", table_text), Paragraph("<b>Importe</b>", table_text)],
        [Paragraph("Implementación inicial", table_text), Paragraph(money("$25,000 MXN"), table_text)],
        [Paragraph("Mensualidad del sistema", table_text), Paragraph(money("$1,500 MXN"), table_text)],
        [Paragraph("Hosting / infraestructura", table_text), Paragraph(money("Incluido"), table_text)],
        [Paragraph("<b>Total mensual estimado</b>", table_text), Paragraph("<b>$1,500 MXN</b>", table_text)],
    ]
    pricing_table = Table(pricing_data, colWidths=[2.55 * inch, 4.05 * inch], hAlign="LEFT")
    pricing_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
                ("BACKGROUND", (0, 4), (-1, 4), colors.HexColor("#F4F6F9")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#DADCE0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.75, colors.HexColor("#DADCE0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 1), (1, -1), "CENTER"),
            ]
        )
    )
    story.append(pricing_table)
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "La implementación inicial cubre la configuración base, puesta en producción, validación del entorno, "
            "personalización básica y ajustes de arranque.",
            body,
        )
    )

    story.append(Paragraph("3. Condiciones comerciales", h1))
    cond_bullets = [
        "Pago mensual anticipado.",
        "Se puede contratar en modalidad anual (12 meses) o a 24 meses, con precio congelado durante la vigencia del contrato.",
        "La mensualidad incluye hosting básico administrado, soporte y mantenimiento sobre lo ya desarrollado.",
        "Agregar usuarios adicionales tiene costo y se cotiza por separado.",
        "En contrato de 24 meses se otorga prioridad en soporte sobre lo ya desarrollado.",
        "No incluye dominio, correo corporativo ni integraciones de terceros no contempladas al arranque.",
        "Nuevos desarrollos o funcionalidades adicionales se cotizan por separado.",
        "Vigencia de la propuesta: 15 días naturales.",
    ]
    story.append(
        ListFlowable(
            [ListItem(Paragraph(item, body_compact)) for item in cond_bullets],
            bulletType="bullet",
            start="circle",
            leftIndent=16,
            bulletFontName="Helvetica",
            bulletFontSize=9,
            bulletOffsetY=2,
            spaceBefore=0,
            spaceAfter=8,
        )
    )

    story.append(Paragraph("4. Cierre", h1))
    story.append(
        Paragraph(
            "Si esta propuesta te hace sentido, el siguiente paso es confirmar el alcance inicial, elegir la modalidad de contratación y programar la salida a producción. A partir de ahí se puede afinar cualquier detalle operativo o de crecimiento.",
            body,
        )
    )

    def add_footer(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(colors.HexColor("#555555"))
        canvas.drawString(doc.leftMargin, 0.6 * inch, "PROPUESTA COMERCIAL")
        canvas.drawRightString(
            letter[0] - doc.rightMargin,
            0.6 * inch,
            f"Página {canvas.getPageNumber()}",
        )
        canvas.setStrokeColor(colors.HexColor("#DADCE0"))
        canvas.setLineWidth(0.7)
        canvas.line(doc.leftMargin, 0.75 * inch, letter[0] - doc.rightMargin, 0.75 * inch)
        canvas.restoreState()

    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)


if __name__ == "__main__":
    build_doc()
    print(f"Created {PDF_PATH}")
