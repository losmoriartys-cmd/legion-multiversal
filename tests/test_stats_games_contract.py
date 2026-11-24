"""Contrato de Rendimiento por juego y de las tablas con color de identidad."""
from __future__ import annotations

import json
import shutil
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NODE = shutil.which("node")
INDEX = (ROOT / "index.html").read_text(encoding="utf-8")
APP = (ROOT / "app.js").read_text(encoding="utf-8")
CSS = (ROOT / "stats-tables.css").read_text(encoding="utf-8")


def run_node(script: str) -> str:
    result = subprocess.run([NODE, "-e", script], capture_output=True, text=True, cwd=ROOT, timeout=60)
    if result.returncode != 0:
        raise AssertionError(result.stderr or result.stdout)
    return result.stdout


@unittest.skipUnless(NODE, "Node.js no está disponible")
class AggregateGamesTests(unittest.TestCase):
    def aggregate(self, channels):
        script = (
            "const api=require('./stats-games.js');"
            f"const out=api.aggregate({json.dumps(channels)},l=>l==='a'?'id-a':'');"
            "process.stdout.write(JSON.stringify(out));"
        )
        return json.loads(run_node(script))

    @staticmethod
    def channel(login, items):
        return {"login": login, "display_name": login.upper(), "window": {"game_breakdown": items}}

    @staticmethod
    def item(name, samples, streams, avg, peak):
        return {"name": name, "live_samples": samples, "streams_observed": streams,
                "average_viewers_sampled": avg, "peak_viewers_sampled": peak}

    def test_merges_case_insensitively_and_weights_the_average_by_samples(self):
        rows = self.aggregate([
            self.channel("a", [self.item("BarFender", 2, 1, 10, 12)]),
            self.channel("b", [self.item("Barfender", 6, 2, 20, 30)]),
        ])
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual((row["streams"], row["samples"], row["peak"]), (3, 8, 30))
        self.assertAlmostEqual(row["average"], (10 * 2 + 20 * 6) / 8)
        self.assertEqual([c["login"] for c in row["creators"]], ["b", "a"])
        self.assertEqual({c["login"]: c["id"] for c in row["creators"]}, {"a": "id-a", "b": ""})

    def test_missing_values_stay_null_and_empty_games_are_skipped(self):
        rows = self.aggregate([self.channel("a", [
            self.item("Sin promedio", 3, 1, None, None),
            self.item("Vacío", 0, 0, 5, 5),
            self.item("", 4, 1, 5, 5),
        ])])
        self.assertEqual([r["name"] for r in rows], ["Sin promedio"])
        self.assertIsNone(rows[0]["average"])
        self.assertIsNone(rows[0]["peak"])

    def test_sorted_by_streams_then_samples(self):
        rows = self.aggregate([self.channel("a", [
            self.item("Poco", 9, 1, 1, 1), self.item("Mucho", 2, 5, 1, 1), self.item("Medio", 4, 1, 1, 1),
        ])])
        self.assertEqual([r["name"] for r in rows], ["Mucho", "Poco", "Medio"])

    def test_real_snapshot_totals_match_an_independent_python_calculation(self):
        data = json.loads((ROOT / "data.json").read_text(encoding="utf-8"))
        channels = [data["channels"][login] for login in data["active_channels"]]
        expected: dict[str, list[int]] = {}
        for channel in channels:
            for item in channel["window"]["game_breakdown"]:
                key = item["name"].strip().lower()
                samples, streams = item["live_samples"], item["streams_observed"]
                if samples <= 0 and streams <= 0:
                    continue
                total = expected.setdefault(key, [0, 0])
                total[0] += streams
                total[1] += samples
        script = (
            "const api=require('./stats-games.js');const d=require('./data.json');"
            "const ch=d.active_channels.map(l=>d.channels[l]);"
            "process.stdout.write(JSON.stringify(api.aggregate(ch,()=>'')));"
        )
        rows = json.loads(run_node(script))
        got = {r["name"].strip().lower(): [r["streams"], r["samples"]] for r in rows}
        self.assertEqual(got, expected)


@unittest.skipUnless(NODE, "Node.js no está disponible")
class RenderGamePerformanceTests(unittest.TestCase):
    SCRIPT = r"""
const fs=require('fs'),vm=require('vm');
const app=fs.readFileSync('app.js','utf8');
function grab(name){const i=app.indexOf('function '+name+'(');let d=0,j=app.indexOf('{',i);
 for(let k=j;k<app.length;k++){if(app[k]==='{')d++;if(app[k]==='}'){d--;if(d===0)return app.slice(i,k+1);}}}
const host={innerHTML:''};
const ctx={window:{LegionStatsGames:require('./stats-games.js')},
 document:{getElementById:id=>id==='stats-game-performance'?host:null},
 heroesData:[{id:'rod3r1k',accounts:[{platform:'twitch',login:'ther0d3r1k'}]}],CH:%s};
vm.createContext(ctx);
vm.runInContext([grab('escapeStatsHtml'),grab('statsNumber'),grab('statsCreatorForLogin'),
 grab('statsRenderGamePerformance'),'statsRenderGamePerformance(CH)'].join('\n'),ctx);
process.stdout.write(host.innerHTML);
"""

    def render(self, channels):
        return run_node(self.SCRIPT % json.dumps(channels))

    def test_rows_carry_creator_identity_and_a_low_sample_flag(self):
        html = self.render([{"login": "ther0d3r1k", "display_name": "TheR0D3R1K", "window": {"game_breakdown": [
            {"name": "Apex Legends", "live_samples": 4, "streams_observed": 2,
             "average_viewers_sampled": 22, "peak_viewers_sampled": 43}]}}])
        self.assertIn('data-creator-id="rod3r1k"', html)
        self.assertIn("Pocas transmisiones", html)
        self.assertIn('data-label="Promedio"', html)
        self.assertIn('<caption class="sr-only">', html)

    def test_game_names_are_escaped(self):
        html = self.render([{"login": "x", "display_name": "<b>X</b>", "window": {"game_breakdown": [
            {"name": '<img src=x onerror=alert(1)>', "live_samples": 1, "streams_observed": 1,
             "average_viewers_sampled": 1, "peak_viewers_sampled": 1}]}}])
        self.assertNotIn("<img", html)
        self.assertNotIn("<b>X</b>", html)
        self.assertIn("&lt;img", html)

    def test_empty_data_shows_a_clear_message(self):
        self.assertIn("Todavía no hay transmisiones observadas", self.render([]))


class SourceContractTests(unittest.TestCase):
    def test_page_loads_the_new_assets_in_a_working_order(self):
        self.assertIn("./stats-tables.css", INDEX)
        self.assertIn('id="stats-game-performance"', INDEX)
        self.assertLess(INDEX.index("./stats-games.js"), INDEX.index("./app.js"))
        self.assertLess(INDEX.index("./creator-colors.css"), INDEX.index("./stats-tables.css"))

    def test_app_wires_the_renderers_and_keeps_the_existing_hooks(self):
        self.assertIn("statsRenderGamePerformance(channels);", APP)
        self.assertEqual(APP.count('class="stats-comparison-row"'), 1)
        self.assertIn("Pico observado", INDEX + APP)
        self.assertIn('id="stats-table-body"', INDEX)

    def test_stylesheet_defines_no_creator_specific_colors(self):
        for creator_id in json.loads((ROOT / "data" / "creator-colors.json").read_text(encoding="utf-8"))["creators"]:
            self.assertNotIn(creator_id, CSS)
        self.assertIn("var(--creator-color", CSS)

    def test_comparison_legend_no_longer_uses_the_old_cyan_and_magenta(self):
        self.assertNotIn("#00d9ef", CSS)
        self.assertNotIn("#ff2bd6", CSS)


if __name__ == "__main__":
    unittest.main()
