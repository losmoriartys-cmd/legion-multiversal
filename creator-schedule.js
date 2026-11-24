(function () {
  'use strict';
  // Horarios publicados por Twitch. Los intervalos se validan antes de mostrarse.
  function upcoming(channel, now) {
    const schedule = channel && channel.schedule;
    if (!schedule || schedule.status !== 'published' || !Array.isArray(schedule.segments)) return [];
    const current = (now instanceof Date ? now : new Date(now || Date.now())).getTime();
    if (!Number.isFinite(current)) return [];
    return schedule.segments.map(function (segment) {
      if (!segment || typeof segment.start_time !== 'string' || !segment.start_time) return null;
      const start = new Date(segment.start_time);
      if (!Number.isFinite(start.getTime())) return null;
      let end;
      if (segment.end_time == null || segment.end_time === '') {
        end = new Date(start.getTime() + 2 * 3600 * 1000);
      } else {
        if (typeof segment.end_time !== 'string') return null;
        end = new Date(segment.end_time);
      }
      if (!Number.isFinite(end.getTime()) || end.getTime() <= start.getTime()) return null;
      return { start: start, end: end, title: String(segment.title || ''), category: String(segment.category || '') };
    }).filter(function (item) {
      return item && item.end.getTime() > current;
    }).sort(function (a, b) { return a.start - b.start; });
  }
  function format(date) {
    try {
      return new Intl.DateTimeFormat('es-AR', {
        weekday: 'short', day: 'numeric', month: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(date).replace('.', '').replace(',', ' ·').replace(/(\\d+)-(\\d+)/, '$1/$2').toUpperCase();
    } catch (error) {
      return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    }
  }
  function next(channel, now) {
    const reference = now instanceof Date ? now : new Date(now || Date.now());
    const items = upcoming(channel, reference);
    if (!items.length) return null;
    const item = items[0];
    const live = item.start.getTime() <= reference.getTime() && reference.getTime() < item.end.getTime();
    return {
      date: item.start,
      end: item.end,
      label: (live ? 'EN HORARIO · ' : '') + format(item.start) + ' (HORA LOCAL)',
      title: item.title,
      category: item.category
    };
  }
  window.LMSchedule = { upcoming: upcoming, next: next, format: format };
})();
