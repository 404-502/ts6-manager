import api from './client';

const base = (configId: number, sid: number) =>
  `/servers/${configId}/vs/${sid}/files`;

export const filesApi = {
  list: (configId: number, sid: number, cid: number, path = '/') =>
    api.get(`${base(configId, sid)}/${cid}`, { params: { path } }).then((r) => r.data),
  createDir: (configId: number, sid: number, cid: number, dirname: string) =>
    api.post(`${base(configId, sid)}/${cid}/mkdir`, { dirname }).then((r) => r.data),
  delete: (configId: number, sid: number, cid: number, name: string) =>
    api.delete(`${base(configId, sid)}/${cid}/file`, { data: { name } }).then((r) => r.data),
  rename: (configId: number, sid: number, cid: number, oldName: string, newName: string) =>
    api.put(`${base(configId, sid)}/${cid}/rename`, { oldName, newName }).then((r) => r.data),
  move: (
    configId: number,
    sid: number,
    cid: number,
    oldName: string,
    targetCid: number,
    newName?: string,
  ) =>
    api
      .put(`${base(configId, sid)}/${cid}/move`, { oldName, targetCid, newName })
      .then((r) => r.data),
  info: (configId: number, sid: number, cid: number, name: string) =>
    api
      .get(`${base(configId, sid)}/${cid}/info`, { params: { name } })
      .then((r) => r.data),
  upload: (
    configId: number,
    sid: number,
    cid: number,
    file: File,
    path = '/',
    onProgress?: (percent: number) => void,
  ) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post(`${base(configId, sid)}/${cid}/upload`, form, {
        params: { path },
        headers: { 'Content-Type': 'multipart/form-data' },
        // 大文件上传可能超过默认 15 秒
        timeout: 0,
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      })
      .then((r) => r.data);
  },
  download: (configId: number, sid: number, cid: number, name: string) =>
    api
      .get(`${base(configId, sid)}/${cid}/download`, {
        params: { name },
        responseType: 'blob',
        timeout: 0,
      })
      .then((r) => r.data as Blob),
};
