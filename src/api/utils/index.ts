import { createRequest } from '..';

const baseUrl = '/utils/';
const request = createRequest(baseUrl);

export function getNewUtils() {
  return request<
    | { result: true; checked: boolean; news: string; newsMark: string }
    | { result: false; err?: string }
  >('get', 'news');
}

export function postUtilsCheckNews(newsMark: string) {
  return request<{ result: true; newsMark: string } | { result: false }>('post', 'check_news', {
    newsMark,
  });
}

export function postUtilsCheckCronExpr(expr: string) {
  return request('post', 'check_cron_expr', { expr });
}

export interface NetworkHealthStatus {
  total: number;
  ok: string[] | null;
  targets?: {
    target: string;
    ok: boolean;
    duration: number;
  }[];
  timestamp: number;
}

export function getUtilsCheckNetWorkHealth() {
  return request<(NetworkHealthStatus & { result: true }) | { result: false }>(
    'get',
    'check_network_health',
  );
}
