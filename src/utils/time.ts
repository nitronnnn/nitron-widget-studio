const DAYS_SHORT = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
const MONTHS_SHORT = ['ЯНВ', 'ФЕВ', 'МАР', 'АПР', 'МАЯ', 'ИЮН', 'ИЮЛ', 'АВГ', 'СЕН', 'ОКТ', 'НОЯ', 'ДЕК'];
const MONTHS_FULL = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const p2 = (n: number) => String(n).padStart(2, '0');

/**
 * Мини-форматтер дат. Токены:
 * HH H hh h mm m ss s A a | DD D MMM MMMM MM M YYYY YY | dd (день недели)
 */
export function formatPattern(date: Date, pattern: string): string {
  const hours = date.getHours();
  const map: Record<string, string> = {
    HH: p2(hours),
    H: String(hours),
    hh: p2(((hours + 11) % 12) + 1),
    h: String(((hours + 11) % 12) + 1),
    mm: p2(date.getMinutes()),
    m: String(date.getMinutes()),
    ss: p2(date.getSeconds()),
    s: String(date.getSeconds()),
    A: hours < 12 ? 'AM' : 'PM',
    a: hours < 12 ? 'am' : 'pm',
    DD: p2(date.getDate()),
    D: String(date.getDate()),
    MMMM: MONTHS_FULL[date.getMonth()],
    MMM: MONTHS_SHORT[date.getMonth()],
    MM: p2(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    YYYY: String(date.getFullYear()),
    YY: p2(date.getFullYear() % 100),
    dd: DAYS_SHORT[date.getDay()],
  };
  return pattern.replace(/MMMM|MMM|YYYY|YY|HH|H|hh|h|mm|m|ss|s|DD|D|dd|A|a/g, (t) => map[t] ?? t);
}

export interface CountdownParts {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  done: boolean;
  totalMs: number;
}

export function countdownParts(targetISO: string, now = Date.now()): CountdownParts {
  const target = Date.parse(targetISO);
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, mins: 0, secs: 0, done: true, totalMs: 0 };
  }
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, done: true, totalMs: 0 };
  const secs = Math.floor(diff / 1000);
  return {
    days: Math.floor(secs / 86400),
    hours: Math.floor((secs % 86400) / 3600),
    mins: Math.floor((secs % 3600) / 60),
    secs: secs % 60,
    done: false,
    totalMs: diff,
  };
}

/** ISO через N дней от сейчас — удобно для дефолтов обратного отсчёта. */
export function isoInDays(days: number): string {
  return new Date(Date.now() + days * 86400_000).toISOString();
}
