import api from './client';

export interface BandwidthPoint {
  /** Bucket start, epoch milliseconds. */
  t: number;
  /** Bytes per second received. */
  in: number;
  /** Bytes per second sent. */
  out: number;
}

export interface BandwidthHistory {
  range: string;
  bucketMs: number;
  from: number;
  to: number;
  /** true when history does not yet cover the start of the requested window. */
  partial: boolean;
  series: BandwidthPoint[];
}

export const dashboardApi = {
  get: (configId: number, sid: number) =>
    api.get(`/servers/${configId}/vs/${sid}/dashboard`).then((r) => r.data),
  bandwidthHistory: (configId: number, sid: number, range: string) =>
    api
      .get(`/servers/${configId}/vs/${sid}/dashboard/bandwidth`, { params: { range } })
      .then((r) => r.data as BandwidthHistory),
};
