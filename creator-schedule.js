(function () {
  'use strict';
  // Horarios que cada canal publica en Twitch (data.json → channels[login].schedule).
  // Se muestran en la hora del visitante. Si el canal no publicó horario, no se muestra nada.
  function upcoming(channel, now) {
    const schedule = channel && channel.schedule;
    if (!schedule || schedule.status !== 'published' || !Array.isArray(schedule.segments)) return [];
    const current = (now || new Date()).getTime();
    return schedule.segments.map(function (segment) {
      const start = new Date(segment.start_time);
      const end = segment.end_time ? new Date(segment.end_time) : new Date(start.getTime() + 2 * 3600 * 1000);
      return { start: start, end: end, title: segment.title || '', category: segment.category || '' };
    }).filter(function (item) {
      return !Number.isNaN(item.start.getTime()) && item.end.getTime() > current;
    }).sort(function (a, b) { return a.start - b.start; });
  }
  function format(date) {
    try {
      const parts = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
      return parts.replace('.', '').replace(',', ' ·').replace(/(\d+)-(\d+)/, '$1/$2').toUpperCase();
    } catch (error) { return date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'; }
  }
  function next(channel, now) {
    const items = upcoming(channel, now);
    if (!items.length) return null;
    const item = items[0];
    const live = item.start.getTime() <= (now || new Date()).getTime();
    return { date: item.start, label: (live ? 'EN HORARIO · ' : '') + format(item.start) + ' (HORA LOCAL)', title: item.title, category: item.category };
  }
  window.LMSchedule = { upcoming: upcoming, next: next, format: format };
})();
