from io import BytesIO

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, DEFAULT_FONT, Border, Side
from openpyxl.utils import get_column_letter

from app.constants.messages import XlsxMessages
from app.utils.datetime import WRITE_DATE_FORMAT, WRITE_TIME_FORMAT, format_date, format_time, parse_date, parse_time


def get_xlsx_styles():
    font = Font(bold=True, size=12)
    thin = Side(border_style='thin', color='000000')
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    return font, border


def is_xlsx_file(file) -> bool:
    if not file or not getattr(file, 'filename', ''):
        return False
    return file.filename.lower().endswith('.xlsx')


def create_xlsx(fields: dict, data: list, date_fields: list = [], time_fields: list = []) -> BytesIO:
    """
    Create an XLSX file with given fields and data
    """
    wb = Workbook()
    ws = wb.active

    # Ensure error column
    fields = {**fields, 'error': 'ERROR'}

    # Write headers
    ws.append(list(fields.values()))

    # Style headers
    font, border = get_xlsx_styles()
    for cell in ws[1]:
        cell.font = font
        cell.border = border

    # Write rows
    for item in data:
        row = []
        for key in fields:
            val = item.get(key, None)
            if key in date_fields:
                row.append(format_date(val))
            elif key in time_fields:
                row.append(format_time(val))
            else:
                row.append(val if val is not None else '')
        ws.append(row)

    # Adjust column widths
    for idx, column_cells in enumerate(ws.columns, 1):
        max_len = max(
            (len(str(cell.value))
             for cell in column_cells if cell.value is not None),
            default=0
        )
        ws.column_dimensions[get_column_letter(idx)].width = max_len + 4

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def generate_xlsx_template(fields: dict, date_fields: list = [], time_fields: list = [], numeric_fields: list = [], text_fields: list = []) -> BytesIO:
    """
    Generate an XLSX template with headers from fields
    """
    wb = Workbook()
    ws = wb.active

    # Default font size
    DEFAULT_FONT.size = 12

    # Write headers
    headers = list(fields.values())
    ws.append(headers)

    # Apply header styles
    font, border = get_xlsx_styles()
    for cell in ws[1]:
        cell.font = font
        cell.border = border

    # Set column widths and types
    for idx, key in enumerate(fields.keys(), start=1):
        col_letter = get_column_letter(idx)
        # Width
        ws.column_dimensions[col_letter].width = len(str(fields[key])) + 4
        # Data type formatting
        for cell in ws[col_letter]:
            if key in date_fields:
                cell.number_format = WRITE_DATE_FORMAT
            elif key in time_fields:
                cell.number_format = WRITE_TIME_FORMAT
            elif key in numeric_fields:
                cell.number_format = '0.00'
            elif key in text_fields:
                cell.number_format = '@'

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def parse_xlsx(file, fields: dict, required_fields: list = [], date_fields=[], time_fields=[]) -> list:
    """
    Parse XLSX file and return list of dicts mapping field names to values
    """
    wb = load_workbook(file, read_only=True)
    ws = wb.active
    headers = [c.value for c in next(ws.iter_rows(min_row=1, max_row=1))]
    header_map = {v: k for k, v in fields.items()}
    idx_map = {i: header_map[h] for i, h in enumerate(headers) if h in header_map}

    results = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if all(v is None for v in row):
            break
        item = {f: None for f in fields}
        for i, v in enumerate(row):
            fld = idx_map.get(i)
            if fld:
                item[fld] = v
        # Parse dates and times
        for fld in date_fields:
            item[fld] = parse_date(item.get(fld))
        for fld in time_fields:
            item[fld] = parse_time(item.get(fld))
        # Check required
        if required_fields:
            missing = [fields[f] for f in required_fields if not item.get(f)]
            if missing:
                item['error'] = XlsxMessages.missing_required_fields(missing)
        results.append(item)
    return results
