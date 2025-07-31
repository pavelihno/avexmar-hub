from io import BytesIO
from openpyxl import Workbook


def create_country_file():
    wb = Workbook()
    ws = wb.active
    ws.append(['Страна', 'Страна (англ)', 'Код A2', 'Код A3'])
    ws.append(['Testland', 'Testland', 'TL', 'TES'])
    bio = BytesIO()
    wb.save(bio)
    bio.seek(0)
    return bio


def create_timezone_file():
    wb = Workbook()
    ws = wb.active
    ws.append(['Часовой пояс'])
    ws.append(['Europe/Moscow'])
    bio = BytesIO()
    wb.save(bio)
    bio.seek(0)
    return bio


def test_country_template(client, admin_headers):
    resp = client.get('/countries/template', headers=admin_headers)
    assert resp.status_code == 200
    assert resp.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


def test_country_upload(client, admin_headers):
    file_obj = create_country_file()
    data = {'file': (file_obj, 'countries.xlsx')}
    resp = client.post('/countries/upload', headers=admin_headers, content_type='multipart/form-data', data=data)
    assert resp.status_code == 201
    assert resp.is_json
    assert resp.get_json()['message'] == 'Countries created successfully'


def test_timezone_template(client, admin_headers):
    resp = client.get('/timezones/template', headers=admin_headers)
    assert resp.status_code == 200
    assert resp.mimetype == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


def test_timezone_upload(client, admin_headers):
    file_obj = create_timezone_file()
    data = {'file': (file_obj, 'timezones.xlsx')}
    resp = client.post('/timezones/upload', headers=admin_headers, content_type='multipart/form-data', data=data)
    assert resp.status_code == 201
    assert resp.is_json
    assert resp.get_json()['message'] == 'Timezones created successfully'
