from urllib.parse import urljoin

from flask import abort, jsonify, make_response, render_template, request
from app.utils.seo import (
    build_seo_schedule_context,
    get_schedule_static_path,
    prerender_filename,
    static_route_cache,
)
from app.models._base_model import NotFoundError
from app.utils.storage import SEOManager


def _build_base_url() -> str:
    return request.url_root.rstrip('/')


def render_static_schedule_page(origin_code: str, dest_code: str):
    origin_code = origin_code.upper()
    dest_code = dest_code.upper()

    seo_manager = SEOManager()
    filename = prerender_filename(origin_code, dest_code)

    try:
        prerendered = seo_manager.read_file(
            filename, 'prerender', as_text=True
        )
        response = make_response(prerendered)
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response
    except (ValueError, OSError):
        pass

    base_url = _build_base_url()

    try:
        context = build_seo_schedule_context(
            origin_code=origin_code,
            dest_code=dest_code,
            base_url=base_url,
        )
    except NotFoundError:
        abort(404)

    return render_template('seo/schedule.html', **context)


def list_static_seo_routes():
    base_url = _build_base_url()
    routes = []

    for route in static_route_cache():
        origin_code = route['origin']['code']
        dest_code = route['destination']['code']

        routes.append(
            {
                'origin': route['origin'],
                'destination': route['destination'],
                'schedule_path': get_schedule_static_path(origin_code, dest_code),
            }
        )

    return jsonify({'routes': routes})
