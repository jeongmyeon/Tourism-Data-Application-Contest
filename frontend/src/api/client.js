import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API 오류:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API 함수

// 관광
export const tourApi = {
  getSpots: (contentTypeId = '12', pageNo = 1) =>
    api.get(`/api/tour/spots?contentTypeId=${contentTypeId}&pageNo=${pageNo}`),
  getFestivals: () => api.get('/api/tour/festivals'),
  getFestivalDetail: (contentId) => api.get(`/api/tour/festival/${contentId}`),
  getTourDetail:(contentId, contentTypeId) => api.get(`/api/tour/festival/${contentId}?contentTypeId=${contentTypeId}`),
  search: (keyword) => api.get(`/api/tour/search?keyword=${encodeURIComponent(keyword)}`),
  getEastCoast: () => api.get('/api/tour/east-coast'),
};

// 날씨
export const weatherApi = {
  getAllGangwon: () => api.get('/api/weather/gangwon'),
  get3DayForecast: (location, nx, ny) => 
    api.get(`/api/weather/forecast?location=${location}&nx=${nx}&ny=${ny}`),
};

// 휴게소
export const restAreaApi = {
  getDonghae: () => api.get('/api/restareas/donghae'),
  getByRoute: (fromCity, toCity, direction) => api.get(`/api/restareas/route?fromCity=${fromCity}&toCity=${toCity}&direction=${direction}`),
  getRealTimeTraffic: (fromCity, toCity) => api.get(`/api/traffic/realtime?fromCity=${fromCity}&toCity=${toCity}`),
}

export const dashboardApi = {
  get: () => api.get('/api/dashboard'),
};

export default api;