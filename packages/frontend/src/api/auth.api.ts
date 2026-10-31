import api from './client';

/** 图形验证码：id 用于登录时回传，image 为 data:image/png;base64,... */
export interface CaptchaResponse {
  id: string;
  image: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}

export const authApi = {
  // 图形验证码一次性、5 分钟有效（后端已返回 Cache-Control: no-store，不缓存）
  getCaptcha: () => api.get<CaptchaResponse>('/auth/captcha').then((r) => r.data),

  login: (username: string, password: string, captchaId: string, captchaCode: string) =>
    api
      .post('/auth/login', { username, password, captchaId, captchaCode } satisfies LoginPayload)
      .then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),

  me: () => api.get('/auth/me').then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }),
};
