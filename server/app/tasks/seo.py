import json
from datetime import datetime, timezone
from typing import Iterable, Mapping

from app.celery_app import celery
from app.config import Config
from app.models._base_model import NotFoundError
from app.utils.seo import prerender_filename, render_schedule
from app.utils.search import upcoming_routes
from app.utils.storage import SEOManager


def _write_index(seo_manager: SEOManager, payload: Iterable[Mapping[str, object]]) -> None:
    """Write index.json file with metadata about prerendered files"""
    index_content = json.dumps(list(payload), ensure_ascii=False, indent=2)
    seo_manager.save_file(index_content, 'index.json', 'prerender')


@celery.task
def generate_prerender() -> int:
    """Generate prerendered schedule pages for popular routes"""

    route_limit = Config.SEO_PRERENDER_ROUTE_LIMIT

    seo_manager = SEOManager()
    generated_at = datetime.now(timezone.utc).isoformat()
    generated_records: list[dict[str, object]] = []
    total = 0

    for origin_code, dest_code in upcoming_routes(limit=route_limit):
        try:
            rendered = render_schedule(
                origin_code=origin_code,
                dest_code=dest_code,
                base_url=Config.CLIENT_URL.rstrip('/'),
            )
        except NotFoundError:
            continue

        filename = prerender_filename(origin_code, dest_code)
        relative_path = seo_manager.save_file(
            rendered['html'],
            filename,
            'prerender'
        )

        generated_records.append(
            {
                'origin': origin_code,
                'destination': dest_code,
                'canonical': rendered['context'].get('canonical'),
                'generated_at': generated_at,
                'filename': filename,
                'path': relative_path,
            }
        )
        total += 1

    _write_index(seo_manager, generated_records)

    return total
