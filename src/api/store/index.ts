import { createRequest } from '..';
import type { StoreBackend, StoreElem, StoreElemType } from '~/type';

const baseUrl = '/store/';
const request = createRequest(baseUrl);

export function storeBackendList() {
  return request<
    | { result: false; err?: string }
    | {
        result: true;
        data: StoreBackend[];
      }
  >('get', 'backend/list');
}

export function storeAddBackend(token: string, url: string) {
  return request<
    | { result: false; err?: string }
    | {
        result: true;
        data: StoreBackend[];
      }
  >('post', 'backend/add', { token, url });
}

export function storeRemoveBackend(token: string, id: string) {
  return request<
    | { result: false; err?: string }
    | {
        result: true;
        data: StoreBackend[];
      }
  >('delete', 'backend/remove', { token, id });
}

export function storeRecommend(params: { type: StoreElemType }) {
  return request<
    | { result: false; err?: string }
    | {
        result: true;
        data: StoreElem[];
      }
  >('get', 'recommend', params);
}

export function storePage(params: {
  backendID: string;
  type: StoreElemType;
  pageNum: number;
  pageSize: number;
  author: string;
  name: string;
  sortBy: 'downloadNum' | 'updateTime';
  order: 'asc' | 'desc';
}) {
  return request<
    | { result: false; err?: string }
    | {
        result: true;
        data: StoreElem[];
        pageNum: number;
        pageSize: number;
        next: boolean;
      }
  >('get', 'page', params);
}

export function storeDownload(token: string, params: StoreElem) {
  return request<
    | { result: false; err?: string }
    | {
        result: true;
      }
  >('post', 'download', params);
}

export function storeRating(token: string, params: { id: string; rate: number }) {
  return request<
    | { result: false; err?: string }
    | {
        result: true;
      }
  >('post', 'rating', params);
}
