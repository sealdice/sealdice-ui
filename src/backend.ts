import axios from 'axios'
import axiosRetry from 'axios-retry'

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000
  }
})

export function newRequestClient(baseURL: string) {
  const client = axios.create({
    baseURL: baseURL,
    timeout: 35000,
    withCredentials: false,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
  });

  client.interceptors.response.use(function (response) {
    return response.data;
  }, function (error) {
    return Promise.reject(error);
  });

  return client;
}


export const urlBase = process.env.NODE_ENV == 'development' ?
  '//' + window.location.hostname + ":" + 3211 :
  '//' + window.location.hostname + ":" + location.port

// 逐渐使用ofetch替换axios
// 后记：发现ofetch也是一团糟，ky也是一团糟，还是axios好用
// 2024.6.12 全都鲨了，只留下 axios

export const backend = newRequestClient(urlBase)
