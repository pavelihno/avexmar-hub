from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, DEFAULT_FONT, Border, Side
from openpyxl.utils import get_column_letter
from io import BytesIO


def get_xlsx_styles():
    font = Font(bold=True, size=12)
    thin = Side(border_style='thin', color='000000')
    border = Border(left=thin, right=thin, top=thin, bottom=thin)
    return font, border


def is_xlsx_file(file) -> bool:
    if not file or not getattr(file, 'filename', ''):
        return False
    return file.filename.lower().endswith('.xlsx')


def create_xlsx(fields: dict, data: list) -> BytesIO:
    """
    Create an XLSX file with given fields and data
    """
    wb = Workbook()
    ws = wb.active

    fields = {
        **fields,
        'error': 'ERROR'
    }

    # Write headers
    headers = list(fields.values())
    ws.append(headers)

    # Header styles
    font, border = get_xlsx_styles()
    for cell in ws[1]:
        cell.font = font
        cell.border = border

    # Write data rows
    for item in data:
        row = [item.get(field, '') for field in fields.keys()]
        ws.append(row)

    # Adjust column widths dynamically
    for idx, column_cells in enumerate(ws.columns, start=1):
        max_length = 0
        for cell in column_cells:
            if cell.value is not None:
                max_length = max(max_length, len(str(cell.value)))
        ws.column_dimensions[get_column_letter(idx)].width = max_length + 4

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return output


def generate_xlsx_template(fields: dict) -> BytesIO:
    """
    Generate an XLSX template with headers from fields
    """
    wb = Workbook()
    ws = wb.active

    # Default font size
    DEFAULT_FONT.size = 12

    ws.append(list(fields.values()))

    # Header styles
    font, border = get_xlsx_styles()
    for cell in ws[1]:
        cell.font = font
        cell.border = border

    # Adjust column widths based on header length
    for idx, header in enumerate(fields.values(), start=1):
        ws.column_dimensions[get_column_letter(idx)].width = len(str(header)) + 4

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    return output


def parse_xlsx(file, fields: dict, required_fields: list = []) -> list:
    """
    Parse XLSX file and return list of dicts mapping field names to values
    """
    wb = load_workbook(file, read_only=True)
    ws = wb.active
    headers = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
    header_to_field = {v: k for k, v in fields.items()}
    col_idx_to_field = {}
    for idx, header in enumerate(headers):
        field = header_to_field.get(header)
        if field:
            col_idx_to_field[idx] = field

    result = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        # Stop parsing if the row has no values in any column
        if all(value is None for value in row):
            break

        item = {}
        for idx, value in enumerate(row):
            field = col_idx_to_field.get(idx)
            if field:
                item[field] = value

        # Fill missing fields with None
        for field in fields:
            if field not in item:
                item[field] = None

        # Check required fields
        if required_fields:
            missing = [fields[f] for f in required_fields if not item.get(f)]
            if missing:
                item['error'] = f"Missing required fields: {', '.join(missing)}"
        result.append(item)

    return result
