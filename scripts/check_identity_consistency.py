#!/usr/bin/env python3
"""
Identidad canónica (hero.id) y conservación de registros · Legión Multiversal

Comprueba por ESTRUCTURA, no por búsqueda de texto:
  1. Cada héroe de roster-data.json tiene un id único y bien formado.
  2. Cada clave de creator-records.json (channels) y platform-stats.json
     (creators) se resuelve a UN hero.id (directo o por un alias declarado).
     Dos claves que resuelven al mismo id se reportan como identidad duplicada.
     Con --strict no se admite ningún alias.
  3. Enlaces existentes: el slug que hoy genera la app a partir del nombre
     (minúsculas, no alfanumérico -> '-') debe ser el id o figurar en
     hero.legacy_slugs; si no, los enlaces #expediente-... ya compartidos se rompen.
  4. Conservación (migración sin pérdidas): --snapshot-out guarda, por id, la
     cantidad y el hash del contenido editorial de creator-records y la
     cantidad de listas de platform-stats; --baseline compara contra ese
     archivo tras migrar. Los nombres de cuenta o URL pueden conservar
     'patoteexplica': solo se comparan CLAVES y CONTENIDOS, no texto.

Uso:
  # antes de migrar
  python3 check_identity_consistency.py --roster roster-data.json \
      --records creator-records.json --platform platform-stats.json \
      --alias patoteexplica=pato-oratoris --snapshot-out base.json \\
      --note "<SHA previo a la migración>"
  # después de migrar
  python3 check_identity_consistency.py --roster roster-data.json \
      --records creator-records.json --platform platform-stats.json \
      --baseline base.json --strict --skip-platform
IMPORTANTE: la instantánea base se toma UNA sola vez ANTES de migrar y se
versiona en el repositorio. No regenerarla en cada corrida de CI.
--skip-platform omite los conteos variables de platform-stats.json.
Pruebas: python3 check_identity_consistency.py --selftest
Salida: 0 OK · 1 falla de datos · 2 error de lectura/configuración.
"""
import argparse, hashlib, json, re, sys, unittest

ID_RE = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


def legacy_slug(name):
    """Misma fórmula que usa app.js hoy para el hash del expediente."""
    return re.sub(r'[^a-z0-9]+', '-', name.lower())


def _h(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def _list_hash(items):
    return _h(sorted(json.dumps(i, sort_keys=True, ensure_ascii=False) for i in items))


def resolve_keys(keys, ids, aliases):
    """-> (mapa clave->id, problemas, alias_usados)"""
    mapping, problems, used = {}, [], []
    for k in keys:
        if k in ids:
            mapping[k] = k
        elif k in aliases and aliases[k] in ids:
            mapping[k] = aliases[k]
            used.append(k)
        else:
            problems.append(f'clave "{k}" no corresponde a ningún hero.id ni alias válido')
    seen = {}
    for k, hid in mapping.items():
        if hid in seen:
            problems.append(f'identidad duplicada: "{seen[hid]}" y "{k}" resuelven a "{hid}"')
        seen.setdefault(hid, k)
    return mapping, problems, used


def check_identity(roster, records, platform, aliases=None, strict=False):
    aliases, problems, warnings = aliases or {}, [], []
    heroes = (roster or {}).get('heroes') or []
    ids = []
    for h in heroes:
        hid = h.get('id')
        if not isinstance(hid, str) or not ID_RE.match(hid):
            problems.append(f'héroe "{h.get("name")}": id ausente o mal formado ({hid!r})')
            continue
        if hid in ids:
            problems.append(f'id duplicado: "{hid}"')
        ids.append(hid)
        old = legacy_slug(h.get('name', ''))
        if old != hid and old not in (h.get('legacy_slugs') or []):
            problems.append(f'enlaces existentes: "#expediente-{old}" dejaría de resolver '
                            f'(id "{hid}"); agregá "{old}" a legacy_slugs')
    for label, data, key in (('creator-records.json', records, 'channels'),
                             ('platform-stats.json', platform, 'creators')):
        if data is None:
            continue
        _, p, used = resolve_keys(list((data.get(key) or {}).keys()), set(ids), aliases)
        problems += [f'{label}: {m}' for m in p]
        for k in used:
            (problems if strict else warnings).append(f'{label}: alias en uso "{k}" -> "{aliases[k]}"')
    return problems, warnings


def snapshot(records, platform, ids, aliases=None, note=None):
    aliases, snap = aliases or {}, {'_meta': {'note': note or ''}, 'creator_records': {}, 'platform_stats': {}}
    if records is not None:
        mapping, _, _ = resolve_keys(list((records.get('channels') or {}).keys()), set(ids), aliases)
        for k, hid in mapping.items():
            entry, out = records['channels'][k], {}
            for f, v in entry.items():
                out[f] = ({'count': len(v), 'sha256': _list_hash(v)} if isinstance(v, list)
                          else {'sha256': _h(v)})
            snap['creator_records'][hid] = out
    if platform is not None:
        mapping, _, _ = resolve_keys(list((platform.get('creators') or {}).keys()), set(ids), aliases)
        for k, hid in mapping.items():
            plats = (platform['creators'][k].get('platforms') or {})
            lists = {f'{pn}.{f}': len(v) for pn, pv in plats.items() if isinstance(pv, dict)
                     for f, v in pv.items() if isinstance(v, list)}
            snap['platform_stats'][hid] = {'platforms': sorted(plats), 'lists': lists}
    return snap


def compare(baseline, current, include_platform=True, approved_editorial=None):
    problems = []
    for hid, fields in baseline.get('creator_records', {}).items():
        cur = current['creator_records'].get(hid)
        if cur is None:
            problems.append(f'creator-records: se perdió el registro de "{hid}"'); continue
        for f, meta in fields.items():
            c = cur.get(f)
            if c is None:
                problems.append(f'creator-records "{hid}": se perdió el campo "{f}"')
            elif 'count' in meta and c.get('count') != meta['count']:
                problems.append(f'creator-records "{hid}.{f}": {meta["count"]} -> {c.get("count")} elementos')
            elif c.get('sha256') != meta['sha256']:
                approved_items = ((approved_editorial or {}).get('creator_records', {})
                                  .get(hid, {}).get(f))
                approved = (isinstance(approved_items, list)
                            and len(approved_items) == meta.get('count')
                            and _list_hash(approved_items) == c.get('sha256'))
                if not approved:
                    problems.append(f'creator-records "{hid}.{f}": el contenido cambió y no coincide con una actualización editorial aprobada')
    for hid, meta in (baseline.get('platform_stats', {}).items() if include_platform else []):
        cur = current['platform_stats'].get(hid)
        if cur is None:
            problems.append(f'platform-stats: se perdió "{hid}"'); continue
        for pn in meta['platforms']:
            if pn not in cur['platforms']:
                problems.append(f'platform-stats "{hid}": se perdió la plataforma "{pn}"')
        for path, n in meta['lists'].items():
            if cur['lists'].get(path) != n:
                problems.append(f'platform-stats "{hid}.{path}": {n} -> {cur["lists"].get(path)} elementos')
    return problems


def _roster(**legacy):
    names = {'moriartys': 'MORIARTYS', 'rod3r1k': 'ROD3R1K', 'lady-moriarty': 'LADYMORIARTY',
             'dave-nexus': 'DAVE — NEXUS', 'pato-oratoris': 'PATO — ORATORIS'}
    return {'heroes': [dict(id=i, name=n, **({'legacy_slugs': legacy[i]} if i in legacy else {}))
                       for i, n in names.items()]}


VIDEOS = [{'video_id': f'v{n}', 'title': f'T{n}'} for n in range(6)]
REC_OLD = {'channels': {'patoteexplica': {'milestones': [], 'highlights': [],
                                          'youtube_videos': VIDEOS}}}
PLAT_OLD = {'creators': {'pato-oratoris': {'platforms': {'youtube': {'recent_videos': VIDEOS[:3]}}}}}
LADY_OK = {'lady-moriarty': ['ladymoriarty']}


class Tests(unittest.TestCase):
    A = {'patoteexplica': 'pato-oratoris'}

    def test_caso_correcto_con_alias_solo_advierte(self):
        p, w = check_identity(_roster(**LADY_OK), REC_OLD, PLAT_OLD, self.A)
        self.assertEqual(p, []); self.assertEqual(len(w), 1)

    def test_strict_rechaza_alias(self):
        p, _ = check_identity(_roster(**LADY_OK), REC_OLD, PLAT_OLD, self.A, strict=True)
        self.assertTrue(any('alias en uso' in m for m in p))

    def test_clave_sin_resolver(self):
        p, _ = check_identity(_roster(**LADY_OK), REC_OLD, None, {})
        self.assertTrue(any('patoteexplica' in m and 'ningún hero.id' in m for m in p))

    def test_identidad_duplicada(self):
        rec = {'channels': {'patoteexplica': {}, 'pato-oratoris': {}}}
        p, _ = check_identity(_roster(**LADY_OK), rec, None, self.A)
        self.assertTrue(any('identidad duplicada' in m for m in p))

    def test_id_duplicado_o_malformado(self):
        r = _roster(**LADY_OK); r['heroes'].append({'id': 'Akuma!', 'name': 'AKUMA'})
        r['heroes'].append({'id': 'moriartys', 'name': 'MORIARTYS'})
        p, _ = check_identity(r, None, None)
        self.assertTrue(any('mal formado' in m for m in p)); self.assertTrue(any('duplicado' in m for m in p))

    def test_enlace_legacy_de_lady_se_rompe_sin_alias(self):
        p, _ = check_identity(_roster(), None, None)
        self.assertTrue(any('#expediente-ladymoriarty' in m for m in p))
        self.assertEqual(check_identity(_roster(**LADY_OK), None, None)[0], [])

    def test_slug_actual_de_los_ocho_nombres(self):
        got = {n: legacy_slug(n) for n in ['MORIARTYS', 'ROD3R1K', 'LADYMORIARTY', 'ARDIPII', 'AKUMA',
                                            'DAVE — NEXUS', 'PATO — ORATORIS', 'HABITOS']}
        self.assertEqual(got['LADYMORIARTY'], 'ladymoriarty')
        self.assertEqual(got['DAVE — NEXUS'], 'dave-nexus')
        self.assertEqual(got['PATO — ORATORIS'], 'pato-oratoris')

    def _snap(self, rec, plat=PLAT_OLD):
        return snapshot(rec, plat, ['pato-oratoris'], self.A)

    def test_migrar_clave_conserva_registros(self):
        base = self._snap(REC_OLD)
        migrated = {'channels': {'pato-oratoris': REC_OLD['channels']['patoteexplica']}}
        self.assertEqual(compare(base, snapshot(migrated, PLAT_OLD, ['pato-oratoris'], {})), [])

    def test_perder_un_video_se_detecta(self):
        base = self._snap(REC_OLD)
        lost = {'channels': {'pato-oratoris': {'milestones': [], 'highlights': [], 'youtube_videos': VIDEOS[:5]}}}
        p = compare(base, snapshot(lost, PLAT_OLD, ['pato-oratoris'], {}))
        self.assertTrue(any('6 -> 5' in m for m in p))

    def test_cambiar_un_contenido_se_detecta(self):
        base = self._snap(REC_OLD)
        v = [dict(x) for x in VIDEOS]; v[0]['title'] = 'otro'
        edited = {'channels': {'pato-oratoris': {'milestones': [], 'highlights': [], 'youtube_videos': v}}}
        p = compare(base, snapshot(edited, PLAT_OLD, ['pato-oratoris'], {}))
        self.assertTrue(any('el contenido cambió' in m for m in p))

    def test_aprobacion_editorial_es_exacta_y_no_cambia_el_baseline(self):
        base = self._snap(REC_OLD)
        videos = [dict(x) for x in VIDEOS]
        videos[0]['title'] = 'Título corregido y aprobado'
        migrated = {'channels': {'pato-oratoris': {
            'milestones': [], 'highlights': [], 'youtube_videos': videos
        }}}
        current = snapshot(migrated, PLAT_OLD, ['pato-oratoris'], {})
        approved = {'creator_records': {'pato-oratoris': {'youtube_videos': videos}}}
        self.assertEqual(compare(base, current, approved_editorial=approved), [])
        altered = [dict(x) for x in videos]
        altered[1]['title'] = 'Cambio no aprobado'
        bad_approval = {'creator_records': {'pato-oratoris': {'youtube_videos': altered}}}
        self.assertTrue(compare(base, current, approved_editorial=bad_approval))
        self.assertEqual(base['_meta']['note'], '')

    def test_perder_el_registro_completo(self):
        base = self._snap(REC_OLD)
        self.assertTrue(any('se perdió el registro' in m for m in
                            compare(base, snapshot({'channels': {}}, PLAT_OLD, ['pato-oratoris'], {}))))


    def test_skip_platform_ignora_conteos_que_cambian_legitimamente(self):
        base = self._snap(REC_OLD)
        plat2 = {'creators': {'pato-oratoris': {'platforms': {'youtube': {'recent_videos': VIDEOS[:2]}}}}}
        cur = snapshot(REC_OLD, plat2, ['pato-oratoris'], self.A)
        self.assertTrue(compare(base, cur))
        self.assertEqual(compare(base, cur, include_platform=False), [])

    def test_meta_no_afecta_la_comparacion(self):
        base = snapshot(REC_OLD, PLAT_OLD, ['pato-oratoris'], self.A, note='SHA previo')
        self.assertEqual(base['_meta']['note'], 'SHA previo')
        self.assertEqual(compare(base, snapshot(REC_OLD, PLAT_OLD, ['pato-oratoris'], self.A)), [])

    def test_platform_stats_cuenta_listas(self):
        base = self._snap(REC_OLD)
        plat2 = {'creators': {'pato-oratoris': {'platforms': {'youtube': {'recent_videos': VIDEOS[:2]}}}}}
        p = compare(base, snapshot(REC_OLD, plat2, ['pato-oratoris'], self.A))
        self.assertTrue(any('youtube.recent_videos' in m and '3 -> 2' in m for m in p))


def _load(path):
    try:
        return json.load(open(path, encoding='utf-8'))
    except FileNotFoundError:
        raise RuntimeError(f'{path}: el archivo no existe')
    except json.JSONDecodeError as e:
        raise RuntimeError(f'{path}: JSON inválido ({e})')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--roster'); ap.add_argument('--records'); ap.add_argument('--platform')
    ap.add_argument('--alias', action='append', default=[], help='clave_vieja=hero.id')
    ap.add_argument('--strict', action='store_true')
    ap.add_argument('--snapshot-out'); ap.add_argument('--baseline')
    ap.add_argument('--approved-editorial', help='JSON con listas editoriales exactas aprobadas; no modifica el baseline histórico')
    ap.add_argument('--note', help='texto libre para la instantánea (p. ej. SHA previo a la migración)')
    ap.add_argument('--skip-platform', action='store_true',
                    help='no comparar platform-stats (sus conteos cambian con cada captura)')
    ap.add_argument('--selftest', action='store_true')
    a = ap.parse_args()
    if a.selftest:
        sys.argv = [sys.argv[0]]; unittest.main(module=__name__, verbosity=2); return
    if not a.roster:
        ap.error('Falta --roster')
    try:
        aliases = dict(x.split('=', 1) for x in a.alias)
        roster = _load(a.roster)
        records = _load(a.records) if a.records else None
        platform = _load(a.platform) if a.platform else None
        problems, warnings = check_identity(roster, records, platform, aliases, a.strict)
        ids = [h.get('id') for h in roster.get('heroes', []) if h.get('id')]
        if a.snapshot_out:
            json.dump(snapshot(records, platform, ids, aliases, a.note), open(a.snapshot_out, 'w', encoding='utf-8'),
                      ensure_ascii=False, indent=2)
            print(f'Instantánea guardada en {a.snapshot_out}')
        if a.baseline:
            approved = _load(a.approved_editorial) if a.approved_editorial else None
            problems += compare(_load(a.baseline), snapshot(records, platform, ids, aliases),
                                include_platform=not a.skip_platform, approved_editorial=approved)
    except (RuntimeError, ValueError) as e:
        print('ERROR:', e); sys.exit(2)
    for w in warnings: print('AVISO:', w)
    for p in problems: print('FALLA:', p)
    print('OK' if not problems else f'{len(problems)} problema(s)')
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
