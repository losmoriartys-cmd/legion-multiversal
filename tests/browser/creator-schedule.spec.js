const { test, expect } = require('@playwright/test');

test('horarios Twitch descartan segmentos inválidos y respetan el intervalo [inicio, fin)', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const now = new Date('2026-11-24T12:00:00Z');
    const channel = { schedule: { status: 'published', segments: [
      { start_time: 'not-a-date', end_time: '2026-11-24T13:00:00Z' },
      { start_time: '2026-11-24T10:00:00Z', end_time: '2026-11-24T11:00:00Z' },
      { start_time: '2026-11-24T11:00:00Z', end_time: 'invalid' },
      { start_time: '2026-11-24T11:00:00Z', end_time: '2026-11-24T11:00:00Z' },
      { start_time: '2026-11-24T11:30:00Z', end_time: '2026-11-24T12:30:00Z', title: 'En curso' },
      { start_time: '2026-11-24T13:00:00Z', end_time: '2026-11-24T14:00:00Z', title: 'Próximo' },
      { start_time: '2026-11-24T14:00:00Z', title: 'Fin estimado' }
    ] } };
    const upcoming = window.LMSchedule.upcoming(channel, now);
    const next = window.LMSchedule.next(channel, now);
    return {
      titles: upcoming.map(item => item.title),
      nextTitle: next && next.title,
      liveLabel: next && next.label.startsWith('EN HORARIO'),
      absent: window.LMSchedule.next({ schedule: { status: 'not_published', segments: [] } }, now),
      empty: window.LMSchedule.upcoming({ schedule: { status: 'published', segments: [] } }, now)
    };
  });
  expect(result.titles).toEqual(['En curso', 'Próximo', 'Fin estimado']);
  expect(result.nextTitle).toBe('En curso');
  expect(result.liveLabel).toBe(true);
  expect(result.absent).toBeNull();
  expect(result.empty).toEqual([]);
});

test('horarios con inicio futuro no se marcan como EN HORARIO y admiten hora local', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const now = new Date('2026-11-24T12:00:00Z');
    const next = window.LMSchedule.next({ schedule: { status: 'published', segments: [
      { start_time: '2026-11-24T13:00:00Z', end_time: '2026-11-24T14:00:00Z' }
    ] } }, now);
    return { label: next.label, formatted: window.LMSchedule.format(next.date) };
  });
  expect(result.label).not.toContain('EN HORARIO');
  expect(result.label).toContain('HORA LOCAL');
  expect(result.formatted).toMatch(/2026|24|13/);
});
