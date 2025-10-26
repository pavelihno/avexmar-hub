from datetime import datetime, timezone

from flask import abort, render_template, request, make_response

from app.constants.branding import BRAND_NAME
from app.utils.seo import build_seo_search_context, build_seo_schedule_context  
from app.models._base_model import NotFoundError
from app.utils.storage import SEOManager


def _build_base_url() -> str:
    return request.url_root.rstrip('/')


def _prerender_filename(origin_code: str, dest_code: str) -> str:
    """Generate filename for prerendered schedule page"""
    return f'schedule_{origin_code.upper()}-{dest_code.upper()}.html'


def render_schedule_page():
    origin_code = request.args.get('from')
    dest_code = request.args.get('to')
    when = request.args.get('when')

    if not origin_code or not dest_code:
        abort(404)

    # Try to serve prerendered file only for routes without specific date
    if not when:
        seo_manager = SEOManager()
        filename = _prerender_filename(origin_code, dest_code)
        
        try:
            prerendered = seo_manager.read_file(filename, 'prerender', as_text=True)
            response = make_response(prerendered)
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
            return response
        except (ValueError, OSError):
            pass

    # Render dynamically
    try:
        context = build_seo_schedule_context(
            origin_code=origin_code,
            dest_code=dest_code,
            base_url=_build_base_url(),
        )
    except NotFoundError:
        abort(404)

    context.update(
        {
            'page_heading': context['title'],
            'current_year': datetime.now(timezone.utc).year,
            'brand_name': BRAND_NAME,
        }
    )

    return render_template('seo/schedule.html', **context)


def render_search_page():
    params = {key: value for key, value in request.args.items()}
    try:
        context = build_seo_search_context(
            params,
            base_url=_build_base_url(),
        )
    except NotFoundError:
        abort(404)

    context.update(
        {
            'page_heading': context['title'],
            'current_year': datetime.now(timezone.utc).year,
            'brand_name': BRAND_NAME,
        }
    )

    return render_template('seo/search.html', **context)
