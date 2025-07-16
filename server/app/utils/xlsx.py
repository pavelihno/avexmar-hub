from openpyxl import Workbook, load_workbook
from io import BytesIO


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

    # Write data rows
    for item in data:
        row = [item.get(field, '') for field in fields.keys()]
        ws.append(row)

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
    ws.append(list(fields.values()))
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


