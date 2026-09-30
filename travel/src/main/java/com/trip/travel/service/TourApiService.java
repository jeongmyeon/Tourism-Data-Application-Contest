package com.trip.travel.service;

import lombok.RequiredArgsConstructor; 
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TourApiService {

    private final WebClient.Builder webClientBuilder;

    @Value("${api.tour.key}")
    private String tourApiKey;

    @Value("${api.tour.base-url}")
    private String baseUrl;

    private static final String GANGWON_AREA_CODE = "32";
    
    private boolean isLocationKeyword(String keyword) {
        List<String> locations = Arrays.asList(
            "삼척", "동해", "강릉", "양양", "속초", 
            "춘천", "원주", "태백", "영월", "정선", "평창", "홍천", "횡성", "철원", "화천", "양구", "인제", "고성"
        );
        return locations.stream().anyMatch(keyword::contains);
    }

    // 관광지/맛집/숙박 조회 
    @Cacheable(value = "tourSpots", key = "#contentTypeId + '_' + #pageNo")
    public List<Map<String, Object>> getGangwonTourSpots(String contentTypeId, int pageNo) {
        String url = UriComponentsBuilder.fromUriString(baseUrl + "/areaBasedList2")
                .queryParam("serviceKey", tourApiKey)
                .queryParam("numOfRows", 200)
                .queryParam("pageNo", pageNo)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "GangwonTravel")
                .queryParam("contentTypeId", contentTypeId)
                .queryParam("areaCode",GANGWON_AREA_CODE)
                .queryParam("_type", "json")
                .build(false)
                .toUriString();
        
        try {
            Map response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            List<Map<String, Object>> allItems = extractItems(response);
            
            // 강원도만 필터링
            List<Map<String, Object>> gangwonItems = allItems.stream()
                    .filter(item -> {
                        String addr = (String) item.get("addr1");
                        return addr != null && (addr.startsWith("강원특별자치도") || addr.startsWith("강원도"));
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            
            return gangwonItems;
            
        } catch (Exception e) {
            log.error("TourAPI 조회 실패 (contentTypeId: {}): {}", contentTypeId, e.getMessage());
            return Collections.emptyList();
        }
    }

    // 좌표 기반 주변 관광지/맛집 조회 (휴게소 근처 추천용, 거리순 정렬)
    public List<Map<String, Object>> getNearbyTourSpots(String mapX, String mapY, int radiusMeters) {
        String url = UriComponentsBuilder.fromUriString(baseUrl + "/locationBasedList2")
                .queryParam("serviceKey", tourApiKey)
                .queryParam("numOfRows", 15)
                .queryParam("pageNo", 1)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "GangwonTravel")
                .queryParam("mapX", mapX)
                .queryParam("mapY", mapY)
                .queryParam("radius", radiusMeters)
                .queryParam("arrange", "E")
                .queryParam("_type", "json")
                .build(false)
                .toUriString();

        try {
            Map response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(8));

            List<Map<String, Object>> items = extractItems(response);

            // 관광지(12), 문화시설(14), 음식점(39)만 추천 대상으로
            List<String> allowedTypes = List.of("12", "14", "39");
            return items.stream()
                    .filter(item -> allowedTypes.contains(String.valueOf(item.get("contenttypeid"))))
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("❌ 주변 관광지 조회 실패 (mapX:{}, mapY:{}): {}", mapX, mapY, e.getMessage());
            return Collections.emptyList();
        }
    }

    // 축제 조회
    @Cacheable(value = "tourFestivals", key = "'all'")
    public List<Map<String, Object>> getGangwonFestivals() {
        LocalDateTime now = LocalDateTime.now();
        String today = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String url = UriComponentsBuilder.fromUriString(baseUrl + "/searchFestival2")
                .queryParam("serviceKey", tourApiKey)
                .queryParam("numOfRows", 200)
                .queryParam("pageNo", 1)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "GangwonTravel")
                .queryParam("eventStartDate", today)
                .queryParam("_type", "json")
                .build(false)
                .toUriString();
        
        try {
            Map response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            List<Map<String, Object>> allItems = extractItems(response);
            
            List<Map<String, Object>> gangwonFestivals = allItems.stream()
                    .filter(item -> {
                        String addr = (String) item.get("addr1");
                        if (addr == null) return false;
                        return addr.startsWith("강원특별자치도") || addr.startsWith("강원도");
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            
            return gangwonFestivals;
            
        } catch (Exception e) {
            log.error("TourAPI 축제 조회 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    // 축제 상세 정보 조회
    public Map<String, Object> getFestivalDetail(String contentId){
        Map<String, Object> result = new LinkedHashMap<>();
        
        // 1. 기본 정보
        String commonUrl = UriComponentsBuilder.fromUriString(baseUrl + "/detailCommon2")
                .queryParam("serviceKey", tourApiKey)
                .queryParam("contentId", contentId)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "GangwonTravel")
                .queryParam("_type", "json")
                .build(false)
                .toUriString();
        
        try {
            Map commonResponse = webClientBuilder.build()
                    .get()
                    .uri(commonUrl)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            List<Map<String, Object>> commonItems = extractItems(commonResponse);
            if(!commonItems.isEmpty()) {
                result = commonItems.get(0);
            }
            
        } catch (Exception e) {
            log.error("축제 기본 정보 조회 실패 (contentId: {}): {}", contentId, e.getMessage());
            return Collections.emptyMap();
        }
        
        // 2. 소개 정보 (detailIntro2) - 축제 요금(usetimefestival) 포함
        String introUrl = UriComponentsBuilder.fromUriString(baseUrl + "/detailIntro2")
                .queryParam("serviceKey", tourApiKey)
                .queryParam("contentId", contentId)
                .queryParam("contentTypeId", "15")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "GangwonTravel")
                .queryParam("_type", "json")
                .build(false)
                .toUriString();
        
        try {
            Map introResponse = webClientBuilder.build()
                    .get()
                    .uri(introUrl)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            List<Map<String, Object>> introItems = extractItems(introResponse);
            if(!introItems.isEmpty()) {
                Map<String, Object> intro = introItems.get(0);
                result.putAll(intro); // usetimefestival 포함됨
            }
        } catch(Exception e) {
            log.error("축제 소개 정보 조회 실패 (contentId: {}): {}", contentId, e.getMessage());
        }
        
        // 3. 반복 정보 (detailInfo2)
        String infoUrl = UriComponentsBuilder.fromUriString(baseUrl + "/detailInfo2")
                .queryParam("serviceKey", tourApiKey)
                .queryParam("contentId", contentId)
                .queryParam("contentTypeId", "15")
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "GangwonTravel")
                .queryParam("_type", "json")
                .build(false)
                .toUriString();
        
        try {
            
            Map infoResponse = webClientBuilder.build()
                    .get()
                    .uri(infoUrl)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            
            List<Map<String, Object>> infoItems = extractItems(infoResponse);
            
            // 반복 정보에서 유용한 정보 추출
            for (Map<String, Object> info : infoItems) {
                String infoname = String.valueOf(info.get("infoname"));
                String infotext = String.valueOf(info.get("infotext"));
                
                
                if (infoname != null && infotext != null && !"null".equals(infotext)) {
                    // 주차 정보
                    if (infoname.contains("주차")) {
                        result.put("parking", infotext);
                    }
                    // 화장실 정보
                    if (infoname.contains("화장실")) {
                        result.put("restroom", infotext);
                    }
                }
            }
            
        } catch(Exception e) {
            log.error("❌ 축제 반복 정보 조회 실패 (contentId: {}): {}", contentId, e.getMessage());
        }
        
        return result;
    }
    
    
    // 키워드 검색
    public List<Map<String, Object>> searchTourSpots(String keyword) {
        String url = UriComponentsBuilder.fromUriString(baseUrl + "/searchKeyword2")
                .queryParam("serviceKey", tourApiKey)
                .queryParam("numOfRows", 100)
                .queryParam("pageNo", 1)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "GangwonTravel")
                .queryParam("_type", "json")
                .queryParam("keyword", keyword)
                .queryParam("areaCode", "32")
                .build(false)
                .toUriString();

        try {
            Map response = webClientBuilder.build()
                    .get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            List<Map<String, Object>> items = extractItems(response);
            
            // API는 제목만 검색하므로, 주소 검색을 위해 전체 데이터에서 필터링
            if (items.isEmpty() || isLocationKeyword(keyword)) {
                List<Map<String, Object>> allData = new ArrayList<>();
                
                // 관광지, 맛집, 숙박 전체 조회
                allData.addAll(getGangwonTourSpots("12", 1)); // 관광지
                allData.addAll(getGangwonTourSpots("39", 1)); // 맛집
                allData.addAll(getGangwonTourSpots("32", 1)); // 숙박
                
                // 제목 또는 주소에 키워드 포함된 항목 필터링
                List<Map<String, Object>> filteredItems = allData.stream()
                        .filter(item -> {
                            String title = String.valueOf(item.get("title"));
                            String addr1 = String.valueOf(item.get("addr1"));
                            String addr2 = String.valueOf(item.getOrDefault("addr2", ""));
                            
                            return title.contains(keyword) || 
                                   addr1.contains(keyword) || 
                                   addr2.contains(keyword);
                        })
                        .collect(Collectors.toList());
                
                return filteredItems;
            }
            
            Map<String, Long> typeCount = items.stream()
                    .collect(Collectors.groupingBy(
                            item -> String.valueOf(item.get("contenttypeid")),
                            Collectors.counting()
                    ));
            return items;
        } catch (Exception e) {
            log.error("TourAPI 검색 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    // 검색 상세 조회 (관광지/맛집/숙박)
    public Map<String, Object> getTourDetail(String contentId, String contentTypeId){
        Map<String, Object> result = new LinkedHashMap<>();
        
        // 1. 기본 정보 
        String commonUrl = UriComponentsBuilder.fromUriString(baseUrl + "/detailCommon2")
                .queryParam("serviceKey", tourApiKey)
                .queryParam("contentId", contentId)
                .queryParam("MobileOS", "ETC")
                .queryParam("MobileApp", "GangwonTravel")
                .queryParam("_type", "json")
                .build(false)
                .toUriString();

        try {
            Map commonResponse = webClientBuilder.build()
                    .get()
                    .uri(commonUrl)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            List<Map<String, Object>> commonItems = extractItems(commonResponse);
            if (!commonItems.isEmpty()) {
                result = commonItems.get(0);
            }
            
        } catch (Exception e) {
            log.error("기본 정보 조회 실패 (contentId: {}): {}", contentId, e.getMessage());
        }
        
        // 2. 소개 정보 (detailIntro2)
        if (contentTypeId != null && !contentTypeId.isEmpty()) {
            String introUrl = UriComponentsBuilder.fromUriString(baseUrl + "/detailIntro2")
                    .queryParam("serviceKey", tourApiKey)
                    .queryParam("contentId", contentId)
                    .queryParam("contentTypeId", contentTypeId)
                    .queryParam("MobileOS", "ETC")
                    .queryParam("MobileApp", "GangwonTravel")
                    .queryParam("_type", "json")
                    .build(false)
                    .toUriString();
            
            try {
                Map introResponse = webClientBuilder.build()
                        .get()
                        .uri(introUrl)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();
                
                List<Map<String, Object>> introItems = extractItems(introResponse);
                if (!introItems.isEmpty()) {
                    Map<String, Object> intro = introItems.get(0);
                    result.putAll(intro);
                }
                
            } catch (Exception e) {
                log.error("소개 정보 조회 실패: {}", e.getMessage());
            }
        }
        
        
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractItems(Map response) {
        try {
            if (response == null) {
                return Collections.emptyList();
            }
            
            Object responseObj = response.get("response");
            if (!(responseObj instanceof Map)) {
                return Collections.emptyList();
            }
            
            Map body = (Map) responseObj;
            Object bodyInnerObj = body.get("body");
            
            if (!(bodyInnerObj instanceof Map)) {
                return Collections.emptyList();
            }
            
            Map bodyInner = (Map) bodyInnerObj;
            Object itemsObj = bodyInner.get("items");
            
            // items가 빈 문자열("")인 경우
            if (itemsObj instanceof String) {
                return Collections.emptyList();
            }
            
            if (!(itemsObj instanceof Map)) {
                return Collections.emptyList();
            }
            
            Map items = (Map) itemsObj;
            Object item = items.get("item");
            
            if (item == null) {
                return Collections.emptyList();
            }
            
            if (item instanceof List) {
                return (List<Map<String, Object>>) item;
            }
            
            if (item instanceof Map) {
                return List.of((Map<String, Object>) item);
            }
            
            return Collections.emptyList();
            
        } catch (Exception e) {
            log.error("❌ TourAPI 응답 파싱 실패: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}