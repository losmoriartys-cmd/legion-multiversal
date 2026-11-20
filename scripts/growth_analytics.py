"""Build source-attributed 7/30/90-day growth, content and collaboration analytics."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

WINDOWS = {"7d": 7, "30d": 30, "90d": 90}
MIN_COVERAGE_PCT = 65.0
HISTORY_DAYS = 180


def parse_time(value: Any):
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else None


def iso(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _coverage(sampled_dates: set[str], start: datetime, end: datetime, days: int) -> dict:
    observed = len(sampled_dates)
    pct = round(min(100.0, observed / max(1, days) * 100), 1)
    return {
        "sampled_days": observed,
        "expected_days": days,
        "coverage_pct": pct,
        "status": "sufficient" if pct >= MIN_COVERAGE_PCT else "partial",
        "minimum_for_comparison_pct": MIN_COVERAGE_PCT,
    }


def _summarize_twitch(snapshots: list[dict], start: datetime, end: datetime, days: int) -> dict:
    selected = []
    for sample in snapshots:
        captured = parse_time(sample.get("sampled_at"))
        if captured is not None and start < captured <= end:
            selected.append((captured, sample))
    selected.sort(key=lambda row: row[0])
    sampled_dates = {captured.date().isoformat() for captured, _ in selected}
    live = [
        (captured, sample) for captured, sample in selected
        if sample.get("is_live") is True and isinstance(sample.get("viewer_count"), int)
        and not isinstance(sample.get("viewer_count"), bool)
    ]
    streams = {str(sample.get("stream_id")) for _, sample in live if sample.get("stream_id")}
    active_days = {captured.date().isoformat() for captured, _ in live}
    active_weeks = {captured.date().isocalendar()[:2] for captured, _ in live}
    viewers = [sample["viewer_count"] for _, sample in live]

    observed_minutes = 0.0
    for (previous_at, previous), (current_at, current) in zip(selected, selected[1:]):
        if previous.get("is_live") is not True or current.get("is_live") is not True:
            continue
        if not previous.get("stream_id") or previous.get("stream_id") != current.get("stream_id"):
            continue
        gap = (current_at - previous_at).total_seconds() / 60
        if 0 < gap <= 110:
            observed_minutes += min(gap, 55)

    coverage = _coverage(sampled_dates, start, end, days)
    return {
        "coverage": coverage,
        "metrics": {
            "streams_observed": len(streams),
            "active_days": len(active_days),
            "active_weeks": len(active_weeks),
            "streams_per_week": round(len(streams) * 7 / max(1, days), 2),
            "observed_live_hours": round(observed_minutes / 60, 2),
            "observed_hours_per_week": round(observed_minutes / 60 * 7 / max(1, days), 2),
            "average_viewers_sampled": round(sum(viewers) / len(viewers), 1) if viewers else None,
            "peak_viewers_sampled": max(viewers) if viewers else None,
            "live_samples": len(live),
        },
    }


def _series_change(points: list[dict], value_key: str, start: datetime, end: datetime) -> dict:
    valid = []
    for point in points:
        at = parse_time(point.get("captured_at"))
        value = point.get(value_key)
        if value is None and isinstance(point.get("metrics"), dict):
            value = point["metrics"].get(value_key)
        if at is not None and isinstance(value, (int, float)) and not isinstance(value, bool):
            valid.append((at, float(value)))
    valid.sort(key=lambda row: row[0])
    inside = [(at, value) for at, value in valid if start < at <= end]
    baseline = max((row for row in valid if row[0] <= start), default=None, key=lambda row: row[0])
    latest = max((row for row in valid if row[0] <= end), default=None, key=lambda row: row[0])
    basis = "period_boundary"
    if baseline is None and len(inside) >= 2:
        baseline = inside[0]
        basis = "since_first_capture"
    if baseline is None or latest is None or latest[0] <= baseline[0]:
        return {
            "status": "baseline_pending",
            "value_start": None,
            "value_end": latest[1] if latest else None,
            "change": None,
            "change_pct": None,
            "captures": len(inside),
            "basis": "insufficient_captures",
            "start_captured_at": None,
            "end_captured_at": iso(latest[0]) if latest else None,
        }
    change = latest[1] - baseline[1]
    return {
        "status": "available",
        "value_start": baseline[1],
        "value_end": latest[1],
        "change": round(change, 2),
        "change_pct": round(change / baseline[1] * 100, 2) if baseline[1] else None,
        "captures": len(inside),
        "basis": basis,
        "start_captured_at": iso(baseline[0]),
        "end_captured_at": iso(latest[0]),
    }


def _summarize_youtube(history: list[dict], start: datetime, end: datetime, days: int) -> dict:
    timestamps = [parse_time(item.get("captured_at")) for item in history if parse_time(item.get("captured_at"))]
    coverage = _coverage({at.date().isoformat() for at in timestamps if start < at <= end}, start, end, days)
    metrics = {
        "subscribers_gained": _series_change(history, "subscribers", start, end),
        "views_gained": _series_change(history, "total_views", start, end),
        "videos_published": _series_change(history, "videos_total", start, end),
    }
    coverage["capture_count"] = sum(1 for at in timestamps if start < at <= end)
    return {"coverage": coverage, "metrics": metrics}


def _delta(current: dict, previous: dict, keys: tuple[str, ...]) -> dict:
    if current["coverage"]["coverage_pct"] < MIN_COVERAGE_PCT or previous["coverage"]["coverage_pct"] < MIN_COVERAGE_PCT:
        return {"status": "insufficient_coverage", "metrics": {}}
    values = {}
    for key in keys:
        left = current["metrics"].get(key)
        right = previous["metrics"].get(key)
        if isinstance(left, (int, float)) and isinstance(right, (int, float)):
            values[key] = {"current": left, "previous": right, "change": round(left - right, 2)}
    return {"status": "available" if values else "insufficient_metrics", "metrics": values}


def build_windows(platform: str, history: list[dict], now: datetime, follower_history: list[dict] | None = None) -> dict:
    result = {}
    for key, days in WINDOWS.items():
        end = now
        start = now - timedelta(days=days)
        previous_end = start
        previous_start = start - timedelta(days=days)
        if platform == "twitch":
            current = _summarize_twitch(history, start, end, days)
            previous = _summarize_twitch(history, previous_start, previous_end, days)
            current["metrics"]["followers"] = _series_change(
                follower_history or [], "followers_total", start, end
            )
            valid_followers = [
                (parse_time(point.get("captured_at")), point.get("followers_total"))
                for point in (follower_history or [])
                if parse_time(point.get("captured_at")) is not None
                and isinstance(point.get("followers_total"), int)
                and not isinstance(point.get("followers_total"), bool)
            ]
            current_follower = max(
                (row for row in valid_followers if row[0] <= end),
                default=None, key=lambda row: row[0],
            )
            current["metrics"]["followers_total"] = current_follower[1] if current_follower else None
            current["metrics"]["followers_captured_at"] = iso(current_follower[0]) if current_follower else None
            previous["metrics"]["followers"] = _series_change(
                follower_history or [], "followers_total", previous_start, previous_end
            )
            comparison = _delta(
                current, previous,
                ("streams_observed", "active_days", "observed_live_hours", "average_viewers_sampled"),
            )
            follower_current = current["metrics"]["followers"]
            follower_previous = previous["metrics"]["followers"]
            if follower_current["status"] == "available" and follower_previous["status"] == "available":
                comparison.setdefault("metrics", {})["followers_gained"] = {
                    "current": follower_current["change"],
                    "previous": follower_previous["change"],
                    "change": round(follower_current["change"] - follower_previous["change"], 2),
                }
            result[key] = {
                "days": days,
                "period": {"from": iso(start), "to": iso(end)},
                "coverage": current["coverage"],
                "metrics": current["metrics"],
                "comparison": {
                    **comparison,
                    "previous_period": {"from": iso(previous_start), "to": iso(previous_end)},
                    "previous_coverage": previous["coverage"],
                },
            }
        elif platform == "youtube":
            current = _summarize_youtube(history, start, end, days)
            previous = _summarize_youtube(history, previous_start, previous_end, days)
            comparison = {"status": "insufficient_metrics", "metrics": {}}
            if current["coverage"]["coverage_pct"] >= MIN_COVERAGE_PCT and previous["coverage"]["coverage_pct"] >= MIN_COVERAGE_PCT:
                values = {}
                for metric_key in ("subscribers_gained", "views_gained", "videos_published"):
                    left, right = current["metrics"][metric_key], previous["metrics"][metric_key]
                    if left["status"] == "available" and right["status"] == "available":
                        values[metric_key] = {"current": left["change"], "previous": right["change"], "change": round(left["change"] - right["change"], 2)}
                comparison = {"status": "available" if values else "insufficient_metrics", "metrics": values}
            else:
                comparison["status"] = "insufficient_coverage"
            result[key] = {
                "days": days,
                "period": {"from": iso(start), "to": iso(end)},
                "coverage": current["coverage"],
                "metrics": current["metrics"],
                "comparison": {
                    **comparison,
                    "previous_period": {"from": iso(previous_start), "to": iso(previous_end)},
                    "previous_coverage": previous["coverage"],
                },
            }
    return result


def _content_change(history: list[dict], days: int, now: datetime, key: str) -> dict:
    start = now - timedelta(days=days)
    return _series_change(history, key, start, now)


def build_content(platform: str, clip_record: dict, platform_record: dict, now: datetime) -> dict:
    if platform == "twitch":
        clips = []
        for clip in clip_record.get("clips") or []:
            history = clip.get("view_history") or []
            views = clip.get("view_count")
            clips.append({
                "id": clip.get("id"),
                "title": clip.get("title"),
                "url": clip.get("url"),
                "created_at": clip.get("created_at"),
                "views": views,
                "views_gained": {
                    key: _content_change(history, days, now, "views")
                    for key, days in WINDOWS.items()
                },
                "captured_at": clip_record.get("captured_at"),
                "source": "Twitch Helix Get Clips",
            })
        clips.sort(key=lambda item: item.get("views") if isinstance(item.get("views"), int) else -1, reverse=True)
        return {
            "status": clip_record.get("status", "not_collected"),
            "captured_at": clip_record.get("captured_at"),
            "source": "Twitch Helix Get Clips",
            "methodology": "Hasta 10 clips públicos más vistos entre los resultados de la API en una ventana de 30 días. Las variaciones de visualizaciones comienzan en la primera captura diaria propia.",
            "top_clips": clips[:5],
            "videos": [],
        }
    if platform == "youtube":
        videos = []
        for video in platform_record.get("recent_videos") or []:
            views = video.get("views")
            likes = video.get("likes")
            comments = video.get("comments")
            interactions = likes + comments if isinstance(likes, int) and isinstance(comments, int) else None
            videos.append({
                "id": video.get("video_id"),
                "title": video.get("title"),
                "url": video.get("url"),
                "published_at": video.get("published_at"),
                "views": views,
                "likes": likes,
                "comments": comments,
                "public_interaction_rate_pct": round(interactions / views * 100, 2) if interactions is not None and isinstance(views, int) and views > 0 else None,
                "views_gained": {
                    key: _content_change(video.get("view_history") or [], days, now, "views")
                    for key, days in WINDOWS.items()
                },
                "captured_at": platform_record.get("captured_at"),
                "source": "YouTube Data API v3",
            })
        videos.sort(key=lambda item: item.get("views") if isinstance(item.get("views"), int) else -1, reverse=True)
        return {
            "status": "verified_public" if platform_record.get("status") == "verified" else platform_record.get("status", "unavailable"),
            "captured_at": platform_record.get("captured_at"),
            "source": "YouTube Data API v3",
            "methodology": "Hasta 10 videos recientes. La tasa pública de interacción se calcula como (me gusta + comentarios) / visualizaciones; no equivale al engagement privado de YouTube Studio. Las variaciones comienzan en la primera captura diaria propia.",
            "top_clips": [],
            "videos": videos[:5],
        }
    return {
        "status": "not_collected",
        "captured_at": None,
        "source": None,
        "methodology": "Todavía no hay un recolector de rendimiento de contenido para esta plataforma.",
        "top_clips": [],
        "videos": [],
    }


def build_shared_cases(roster: dict) -> dict:
    grouped: dict[tuple[str, str], dict] = {}
    for hero in roster.get("heroes") or []:
        creator_id = hero.get("id") or hero.get("slug")
        for entry in hero.get("bitacora") or []:
            title = entry.get("title")
            if entry.get("type") != "expediente" or not isinstance(title, str):
                continue
            key = (title.strip(), str(entry.get("date") or ""))
            case = grouped.setdefault(key, {
                "title": key[0],
                "date": key[1] or None,
                "participants": [],
                "deliverables": [],
                "source": "Bitácora de los creadores",
                "status": "documented",
            })
            if creator_id and creator_id not in case["participants"]:
                case["participants"].append(creator_id)
            if entry.get("url"):
                case["deliverables"].append({
                    "creator_id": creator_id,
                    "url": entry["url"],
                    "source": entry.get("source") or "Enlace registrado en Bitácora",
                })
    for case in grouped.values():
        case["participants"].sort()
        case["deliverables"].sort(key=lambda item: item.get("creator_id") or "")
    return grouped


def _authorized_audience_report(report: dict | None) -> dict:
    if not isinstance(report, dict):
        return {"status": "not_provided", "metrics": []}
    authorization = report.get("authorization") or {}
    if authorization.get("status") != "granted" or authorization.get("public_display") is not True:
        return {"status": "not_publicly_authorized", "metrics": []}
    if not report.get("source") or not parse_time(report.get("captured_at")):
        return {"status": "invalid_evidence", "metrics": []}
    period = report.get("period") or {}
    if not parse_time(period.get("from")) or not parse_time(period.get("to")):
        return {"status": "invalid_evidence", "metrics": []}
    metrics = []
    for item in report.get("metrics") or []:
        if not isinstance(item, dict) or not item.get("label") or not item.get("unit"):
            continue
        value = item.get("value")
        if isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0:
            metrics.append({
                "key": item.get("key"),
                "label": item["label"],
                "value": value,
                "unit": item["unit"],
                "scope": "creator_authorized_aggregate",
            })
    if not metrics:
        return {"status": "invalid_evidence", "metrics": []}
    breakdowns = []
    for item in report.get("breakdowns") or []:
        if not isinstance(item, dict):
            continue
        dimension = item.get("dimension")
        label = item.get("label")
        share = item.get("share_pct")
        sample_size = item.get("sample_size")
        # Solo publicar segmentos agregados con una base mínima; nunca perfiles individuales.
        if dimension not in {"age_range", "region", "country"}:
            continue
        if not isinstance(label, str) or not label.strip():
            continue
        if not isinstance(share, (int, float)) or isinstance(share, bool) or not 0 <= share <= 100:
            continue
        if not isinstance(sample_size, int) or isinstance(sample_size, bool) or sample_size < 5:
            continue
        breakdowns.append({
            "dimension": dimension,
            "label": label,
            "share_pct": round(float(share), 1),
            "sample_size": sample_size,
        })
    return {
        "status": "authorized_public_aggregate",
        "captured_at": report["captured_at"],
        "period": period,
        "source": report["source"],
        "metrics": metrics,
        "breakdowns": breakdowns,
        "note": "Datos agregados aportados por el creador y autorizados para publicación. No incluyen identidades ni segmentos con menos de cinco observaciones.",
    }


def build_collaborations(creator_id: str, records: dict, shared_cases: dict) -> dict:
    creator = (records.get("channels") or {}).get(creator_id) or {}
    cases = [case for case in shared_cases.values() if creator_id in case.get("participants", [])]
    return {
        "shared_cases": cases,
        "reported_results": creator.get("collaboration_results") or [],
        "relationships": creator.get("collaborations") or [],
        "methodology": "Los resultados por canal se muestran separados; no se suman espectadores, chatters ni audiencias entre canales. Los datos declarados por creadores se identifican como aportados y no verificados por APIs públicas.",
    }


def build_growth(creator_id: str, hero: dict, channel: dict, platform_record: dict, clip_record: dict, records: dict, shared_cases: dict, now: datetime) -> dict:
    account = next((
        item for item in (hero.get("accounts") or [])
        if item.get("account_type") == "creator_channel"
    ), None)
    platform = account.get("platform") if account else None
    if platform == "twitch":
        snapshots = channel.get("snapshots") or []
        windows = build_windows("twitch", snapshots, now, channel.get("followers_history") or [])
        content = build_content("twitch", clip_record, {}, now)
    elif platform == "youtube":
        history = platform_record.get("history") or []
        windows = build_windows("youtube", history, now)
        content = build_content("youtube", {}, platform_record, now)
    else:
        windows = {}
        content = build_content(platform or "", {}, {}, now)
    creator_record = (records.get("channels") or {}).get(creator_id) or {}
    return {
        "schema_version": 1,
        "generated_at": iso(now),
        "platform": platform,
        "history_days_required": HISTORY_DAYS,
        "windows": windows,
        "content_performance": content,
        "collaborations": build_collaborations(creator_id, records, shared_cases),
        "advanced_audience": _authorized_audience_report(creator_record.get("audience_report")),
    }
