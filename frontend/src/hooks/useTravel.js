import { useQuery } from '@tanstack/react-query';
import { tourApi, weatherApi, dashboardApi, restAreaApi } from '../api/client';

// 날씨 
export function useGangwonWeather() {
  return useQuery({
    queryKey: ['weather', 'gangwon'],
    queryFn: weatherApi.getAllGangwon,
    refetchInterval: 60 * 1000,
    staleTime: 55 * 1000,
  });
}

// 3일 예보
export function use3DayForecast(location, nx, ny) {
  return useQuery({
    queryKey: ['forecast', location, nx, ny],
    queryFn: () => weatherApi.get3DayForecast(location, nx, ny),
    enabled: !!location && !!nx && !!ny,
    staleTime: 10 * 60 * 1000,
  });
}

// 관광지 
export function useTourSpots(contentTypeId = '12', pageNo = 1) {
  return useQuery({
    queryKey: ['tourSpots', contentTypeId, pageNo],
    queryFn: () => tourApi.getSpots(contentTypeId, pageNo),
    staleTime: 10 * 60 * 1000,
  });
}

// 축제 
export function useFestivals() {
  return useQuery({
    queryKey: ['festivals'],
    queryFn: tourApi.getFestivals,
    staleTime: 10 * 60 * 1000,
  });
}

// 축제 상세
export function useFestivalDetail(contentId){
  return useQuery({
    queryKey: ['festivalDetail', contentId],
    queryFn: () => tourApi.getFestivalDetail(contentId),
    enabled: !!contentId,
  });
}

// 검색 
export function useTourSearch(keyword) {
  return useQuery({
    queryKey: ['tourSearch', keyword],
    queryFn: () => tourApi.search(keyword),
    enabled: !!keyword && keyword.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

// 검색 결과
export function useTourDetail(contentId, contentTypeId){
  return useQuery({
    queryKey: ['tourDetail',contentId, contentTypeId],
    queryFn: () => tourApi.getTourDetail(contentId, contentTypeId),
    enabled: !!contentId && !!contentTypeId,
  })
}

// 동해안 데이터
export function useEastCoast(){
  return useQuery({
    queryKey: ['eastCoast'],
    queryFn: tourApi.getEastCoast,
    staleTime: 10 * 60 * 1000,
  });
}

// 동해안 휴게소 조회
export function useDonghaeRestAreas(){
  return useQuery({
    queryKey: ['donghaeRestAreas'],
    queryFn: restAreaApi.getDonghae,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}

// 휴게소 정보 조회
export function useRestAreasByRoute(fromCity, toCity, direction){
  return useQuery({
    queryKey: ['restAreasByRoute', fromCity, toCity, direction],
    queryFn: () =>restAreaApi.getByRoute(fromCity, toCity, direction),
    enabled: !!fromCity && !!toCity && !!direction,
    staleTime : 24 * 60 * 60 * 1000,
  })
}

// 실시간 교통 정보
export function useRealTimeTraffic(fromCity,toCity){
  return useQuery({
    queryKey: ['realTimeTraffic', fromCity, toCity],
    queryFn: () => restAreaApi.getRealTimeTraffic(fromCity, toCity),
    enabled: !!fromCity && !!toCity,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}


// 대시보드 통합 
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 60 * 1000,
    staleTime: 55 * 1000,
  });
}