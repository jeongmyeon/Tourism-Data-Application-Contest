import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  useGangwonWeather, 
  useFestivals, 
  useEastCoast, 
  useTourSearch,
  useDonghaeRestAreas, 
  useRealTimeTraffic
} from '../hooks/useTravel';
import FestivalModal from '../components/FestivalModal';
import TourDetailModal from '../components/TourDetailModal';
import CardImage from '../components/CardImage';

export default function MainPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [sliderPosition, setSliderPosition] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('spots');
  const { data: weatherData } = useGangwonWeather();
  const { data: festivals } = useFestivals();
  const { data: eastCoastData, isLoading } = useEastCoast();
  const { data: searchResults } = useTourSearch(keyword);
  const { data: restAreas, isLoading: restAreasLoading } = useDonghaeRestAreas();
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [selectedTourItem, setSelectedTourItem] = useState(null);
  const [festivalsToShow, setFestivalsToShow] = useState(5);
  const [prevSliderPosition, setPrevSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cities = useMemo(() => ['삼척', '동해', '강릉', '양양', '속초'],[]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const festivalSectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if(window.scrollY > 300){
        setShowScrollTop(true);
      }else{
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll',handleScroll);
    return () => window.removeEventListener('scroll',handleScroll);
  },[])

  const scrollTop = () =>{
    window.scrollTo({
      top:0,
      behavior: 'smooth'
    });
  };

  const handleLoadMore = () =>{
    const currentCount = festivalsToShow;
    setFestivalsToShow(prev => prev +5);

    setTimeout(() => {
      const cards = document.querySelectorAll('.festival-card');
      if(cards[currentCount]){
        cards[currentCount].scrollIntoView({
          behavior:'smooth',
          block:'center'
        });
      }
    },100);
  }
  const formatPrice = (price) => {
    if(!price) return '-';
    const numericPrice = String(price).replace(/[^0-9]/g,'');
    return numericPrice ? parseInt(numericPrice).toLocaleString() + '원' : '-';
  }

  const movingDirection = useMemo(() => {
    if(sliderPosition > prevSliderPosition){
      return '상행';
    }else if(sliderPosition < prevSliderPosition){
      return '하행';
    }
    return '상행';
  },[sliderPosition, prevSliderPosition]);

  // 슬라이더 위치 동적 생성 (API 데이터 기반)
  const {currentCity, currentRestArea} = useMemo(() => {
    const cityCount = cities.length;
    if(!restAreas || restAreas.length === 0){
      const cityIndex = Math.floor(sliderPosition / 100) * cityCount;
      const clampedIndex = Math.min(cityIndex, cityCount -1);
      return { currentCity: cities[clampedIndex], currentRestArea: null};
    }

    
    const segments = [];
    for(let i = 0; i < cities.length - 1; i++){
      const fromCity = cities[i];
      const toCity = cities[i + 1];
      
      const upRestAreas = restAreas.find(area => area.fromCity === fromCity && area.toCity === toCity && area.direction === '상행');
      const downRestAreas = restAreas.find(area => area.fromCity === toCity && area.toCity === fromCity && area.direction === '하행');
      
      segments.push({
        fromCity, toCity, upRestAreas, downRestAreas,
      });
    }
    
    const segmentPercent = 100 / (cities.length - 1);
    const segmentIndex = Math.floor(sliderPosition / segmentPercent);
    const clampedSegmentIndex = Math.min(segmentIndex, segments.length - 1);
    const currentSegment = segments[clampedSegmentIndex];
    
    const positionInSegment = (sliderPosition % segmentPercent) / segmentPercent * 100;
    
    if(positionInSegment < 30){
      return { 
        currentCity: currentSegment.fromCity,
        currentRestArea: null
      };
    } else if(positionInSegment >= 70){
      return {
        currentCity: currentSegment.toCity,
        currentRestArea: null
      };
    } else {
      const restArea = movingDirection === '상행' ? currentSegment.upRestAreas : currentSegment.downRestAreas;
      
      if(!restArea){
        return {
          currentCity: null,
          currentRestArea: {
            name: '휴게소 없음',
            fromCity: currentSegment.fromCity,
            toCity: currentSegment.toCity,
            direction: movingDirection,
            noRestArea: true
          }
        };
      }
      
      return {
        currentCity: null,
        currentRestArea: restArea
      };
    }
  }, [sliderPosition, restAreas, movingDirection, cities]);
  
  const fromCity = currentRestArea?.fromCity || currentCity;
  const toCity = currentRestArea?.toCity;
  const {data: trafficInfo} = useRealTimeTraffic(fromCity, toCity);
  
  const weatherCityMap = {
    '삼척': '삼척',
    '동해': '동해',
    '강릉': '강릉',
    '양양': '양양',
    '속초': '속초'
  };

  const weatherList = cities.map(city => {
    const mappedCity = weatherCityMap[city];
    return weatherData?.find(w => w.location === mappedCity) || 
           { location: city, tmp: '--', skyText: '정보없음' };
  });

  const currentCityData = eastCoastData?.[currentCity] || { spots: [], festivals: [], restaurants: [], hotels: [] };

  const categories = [
    { id: 'spots', label: '관광지', icon: '🏔️' },
    { id: 'festivals', label: '축제', icon: '🎉' },
    { id: 'restaurants', label: '맛집', icon: '🥢' },
    { id: 'hotels', label: '숙박', icon: '🏨' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* 검색 */}
      <div style={{
        background: 'linear-gradient(135deg, #2D6A4F 0%, #1565C0 100%)',
        padding: '48px 32px',
        borderRadius: '16px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '12px' }}>
          🏔 강원 여행 가이드
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '24px' }}>
          동해안 고속도로를 따라 펼쳐지는 여행지
        </p>
        {/* 검색 창 */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if(keyword.trim().length >= 2){
            navigate(`/search?q=${encodeURIComponent(keyword.trim())}`);
          }else{
            alert('검색어는 최소 2글자 이상이어야 합니다');
          }
        }} 
          style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="관광지, 맛집, 숙소 검색..."
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '15px'
              }}
            />
            <button
              type="submit"
              style={{
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                background: 'white',
                color: '#2D6A4F',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              검색
            </button>
          </div>
        </form>

        {searchResults && searchResults.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            background: 'white', 
            borderRadius: '12px', 
            padding: '16px',
            textAlign: 'left',
            color: '#333'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
              검색 결과 {searchResults.length}건
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.slice(0, 5).map((item, i) => (
                <div key={i} style={{ fontSize: '13px', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{item.title}</div>
                  {item.addr1 && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>📍 {item.addr1}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 날씨 + 동해안 가이드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        
        {/* 날씨 */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            ⛅ 동해안 날씨
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {weatherList.map((w) => (
              <div key={w.location} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>
                      {w.location}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      {w.ptyText !== '없음' ? w.ptyText : w.skyText}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px' }}>
                      {w.skyText === '맑음' ? '☀️' : w.skyText === '구름많음' ? '⛅' : '☁️'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#1565C0' }}>
                      {w.tmp}°
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 동해안 고속도로 가이드 */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
            🚗 동해안 고속도로 여행 가이드
          </h2>
          
          <div className="card" style={{ padding: '32px' }}>
            {/* 슬라이더 */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                {cities.map((city,idx) => (
                  <div key={city} 
                  onClick={() =>{
                    const segmentPercent = 100 / (cities.length -1);
                    const targetPosition = idx * segmentPercent;
                    setPrevSliderPosition(sliderPosition)
                    setSliderPosition(targetPosition);
                  }}
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: currentCity === city ? 700 : 400,
                    color: currentCity === city ? '#1565C0' : '#888',
                    cursor:'pointer'
                  }}>
                    {city}
                  </div>
                ))}
              </div>

              {/* 슬라이더 바 */}
              <div style={{position: 'relative', padding: '20px 0',marginBottom: '16px'}}>
                <div style={{
                  position: 'absolute',
                  left: `calc(${sliderPosition}% - 20px)`,
                  top: '0px',
                  fontSize: '40px',
                  pointerEvents: 'none',
                  transition: isDragging? 'none' : 'left 0.05s linear',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                }}>
                  🚗
                </div>
              <input
                type="range"
                min="0"
                max="99"
                step="0.5"
                value={sliderPosition}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onChange={(e) => {
                  setPrevSliderPosition(sliderPosition);
                  setSliderPosition(Number(e.target.value))}}
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '4px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none',
                  background: `linear-gradient(to right, #1565C0 0%, #1565C0 ${sliderPosition}%, #E0E0E0 ${sliderPosition}%, #E0E0E0 100%)`,
                  cursor: 'pointer',
                }}
              />
              
              <style>
                {`
                  input[type="range"]::-webkit-slider-thumb{
                  -webkit-appearance: nonr;
                  appearance: none;
                  width: 40px;
                  height: 40px;
                  background: transparent;
                  cursor: grab;
                  border: none;
                  }

                  input[type="range"]::-webkit-slider-thumb:active{
                  cusor: grabbing;
                  }

                  input[type="range"]::-moz-range-thumb{
                  width: 40px;
                  height: 40px;
                  background: transparent;
                  border: none;
                  cursor: grab;
                  }

                  input[type="range"]::-moz-range-thumb:active{
                  cursor: grabbing;
                  }
                `}
              </style>
            </div>
              <div style={{ 
                position:'relative',
                textAlign:'center',
                marginTop:'16px',
                fontSize:'18px',
                fontWeight:700,
                color:  currentRestArea?.noRestArea ? '#888' : (currentRestArea ? '#f57c00' : '#1565C0')
              }}>
                <div style={{flex :1}}></div>
                <span>
                  {currentRestArea?.noRestArea ? '⚠️' : (currentRestArea ? '🏠' : '📍')} 
                  현재 위치: {currentRestArea ? currentRestArea.name : currentCity}
                </span>

                {/* 전체보기 */}
                {!currentRestArea && currentCity && (
                  <button 
                    onClick={() => navigate(`/search?q=${encodeURIComponent(currentCity)}`)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      border: '1px solid #1565C0',
                      background: 'white',
                      color: '#1565C0',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#1565C0';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) =>{
                      e.target.style.background = 'white';
                      e.target.style.color = '#1565C0';
                    }}>
                      전체보기
                    </button>
                )}
              </div>
              
              {/* 휴게소 상세 정보 */}
              {currentRestArea && !currentRestArea.noRestArea && (
                <div style={{
                  background: '#fff3e0',
                  border: '2px solid #f57c00',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '16px',
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#f57c00' }}>
                    🏠 {currentRestArea.name} ({currentRestArea.direction})
                  </h3>
                  

                  {/* 실시간 교통 정보 */}
                  {trafficInfo && trafficInfo.noData? (
                    <div style={{
                      background: '#f5f5f5',
                      border: '2px solid #4CAF50',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        display:'flex',
                        alignItems:'center',
                        gap:'8px',
                        marginBottom:'8px'
                      }}>
                        <strong style={{color:'#666'}}>실시간 교통: </strong>
                        <span style={{
                          padding:'4px 12px',
                          background:'#4CAF50',
                          color:'white',
                          borderRadius:'12px',
                          fontSize:'13px',
                          fontWeight:700
                        }}>
                          한산
                        </span>
                      </div>
                      <div style={{fontSize:'13px',color:'#666'}}>
                        교통량이 매우 적어 쾌적한 주행이 가능합니다.
                      </div>
                    </div>
                  ) : trafficInfo && trafficInfo.available !== false &&(
                    <div style={{
                      background: '#fff',
                      border: `2px solid ${trafficInfo.congestionColor}`,
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap:'8px', marginBottom:'8px'}}>
                        <strong style={{color:'#666' }}>🚗 실시간 교통:</strong>
                        <span style={{
                          padding:'4px 12px',
                          background: trafficInfo.congestionColor,
                          color:'white',
                          borderRadius:'12px',
                          fontSize:'13px',
                          fontWeight: 700
                        }}>
                          {trafficInfo.congestionLevel}
                        </span>
                      </div>
                      <div style={{fontSize:'13px', color:'#666'}}>
                        평균 {trafficInfo.timeAvg}분 (최소 {trafficInfo.timeMin}분 ~ 최대 {trafficInfo.timeMax}분)
                      </div>
                    </div>
                  )}
                  
              
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#666' }}>📍 구간:</strong> {currentRestArea.fromCity} → {currentRestArea.toCity}
                    </div>
        
                    {/* 전화 */}
                    {currentRestArea.tel && (
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#666' }}>📞 전화:</strong> {currentRestArea.tel}
                      </div>
                    )}

                    {/* 주유쇼 */}
                    {currentRestArea.gasStation ? (
                      <div style={{
                        background:'#fff',
                        border: '2px solid #2196F3',
                        borderRadius:'8px',
                        padding:'12px',
                        marginBottom:'12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <strong style={{ color: '#666' }}>⛽ 주유소:</strong>
                          <span style={{ fontSize: '13px', color: '#2196F3', fontWeight: 600 }}>
                            {currentRestArea.gasStation.oilCompany}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '12px' }}>
                          {currentRestArea.gasStation.gasolinePrice && (
                            <div style={{ textAlign: 'center', padding: '8px', background: '#E3F2FD', borderRadius: '6px' }}>
                              <div style={{ color: '#666', marginBottom: '2px' }}>휘발유</div>
                              <div style={{ fontWeight: 700, color: '#2196F3' }}>
                                {formatPrice(currentRestArea.gasStation.gasolinePrice)}
                              </div>
                            </div>  
                          )}
                          {currentRestArea.gasStation.dieselPrice && (
                            <div style={{ textAlign: 'center', padding: '8px', background: '#E8F5E9', borderRadius: '6px' }}>
                              <div style={{ color: '#666', marginBottom: '2px' }}>경유</div>
                              <div style={{ fontWeight: 700, color: '#4CAF50' }}>
                                {formatPrice(currentRestArea.gasStation.dieselPrice)}
                              </div>
                            </div>
                          )}
                          
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background:'#f5f5f5',
                        border: '2px solid #999',
                        borderRadius:'8px',
                        padding:'12px',
                        marginBottom:'12px',
                        textAlign: 'center'
                      }}>
                        <div style={{color: '#666', fontSize: '13px'}}>
                          ⛽ 주유소 없음
                        </div>
                      </div>
                    )}

                </div>
              )}


              {/* 휴게소 없음 안내 */}
              {currentRestArea?.noRestArea && (
                <div style={{
                  background: '#f5f5f5',
                  border: '2px solid #888',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{fontSize: '16px', color:'#666', marginBottom:'8px'}}>
                    ⚠️ 이 구간에는 휴게소가 없습니다
                  </div>
                  <div style={{ fontSize: '14px', color: '#888' }}>
                    📍 구간: {currentRestArea.fromCity} → {currentRestArea.toCity}
                  </div>
                
                {trafficInfo && trafficInfo.noData ? (
                  <div style={{
                    background: '#fff',
                    border: '2px solid #4CAF50',
                    borderRadius: '8px',
                    padding: '12px',
                     marginTop: '12px'
                  }}>
                    <div style={{
                      display:'flex',
                      alignItems:'center',
                      gap:'8px',
                      marginBottom:'8px',
                      justifyContent: 'center'
                    }}>
                    <strong style={{color:'#666'}}>🚗 실시간 교통: </strong>
                    <span style={{
                      padding:'4px 12px',
                      background:'#4CAF50',
                      color:'white',
                      borderRadius:'12px',
                      fontSize:'13px',
                      fontWeight:700
                    }}> 
                    한산
                    </span>
                  </div>
                  <div style={{fontSize:'13px',color:'#666'}}>
                        교통량이 매우 적어 쾌적한 주행이 가능합니다.
                  </div>
                  </div>
                    ) : trafficInfo && trafficInfo.available === true && (
                      <div style={{
                        background: '#fff',
                        border: `2px solid ${trafficInfo.congestionColor}`,
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '12px'
                      }}>
                        <div style={{display: 'flex', alignItems: 'center', gap:'8px', marginBottom:'8px', justifyContent: 'center'}}>
                          <strong style={{color:'#666' }}>🚗 실시간 교통:</strong>
                          <span style={{
                            padding:'4px 12px',
                            background: trafficInfo.congestionColor,
                            color:'white',
                            borderRadius:'12px',
                            fontSize:'13px',
                            fontWeight: 700
                          }}>
                            {trafficInfo.congestionLevel}
                          </span>
                        </div>
                        <div style={{fontSize:'13px', color:'#666', textAlign: 'center'}}>
                          평균 {trafficInfo.timeAvg}분 (최소 {trafficInfo.timeMin}분 ~ 최대 {trafficInfo.timeMax}분)
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* 카테고리 탭 - 도시일 때만 표시 */}
            {!currentRestArea && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: selectedCategory === cat.id ? '2px solid #1565C0' : '1px solid #E0E0E0',
                        background: selectedCategory === cat.id ? '#E3F2FD' : '#fff',
                        color: selectedCategory === cat.id ? '#1565C0' : '#666',
                        fontWeight: selectedCategory === cat.id ? 700 : 500,
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all .2s',
                      }}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>

                {/* 컨텐츠 영역 */}
                <div>
                  {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
                      데이터 로딩 중...
                    </div>
                  ) : (
                    <>
                      {/* 관광지 */}
                      {selectedCategory === 'spots' && (
                        <>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                            🏔️ {currentCity} 추천 관광지
                          </h3>
                          {currentCityData.spots && currentCityData.spots.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                              {currentCityData.spots.slice(0, 4).map((spot, i) => (
                                <div
                                  key={i}
                                  className="card"
                                  style={{ padding: '16px', cursor: 'pointer' }}
                                  onClick={() => setSelectedTourItem(spot)}
                                >
                                  <CardImage src={spot.firstimage} alt={spot.title} height="120px" />
                                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                    {spot.title}
                                  </div>
                                  {spot.addr1 && (
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                      📍 {spot.addr1.split(' ').slice(-2).join(' ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '48px', color: '#888', background: '#f8f9fa', borderRadius: '8px' }}>
                              관광지 정보가 없습니다
                            </div>
                          )}
                        </>
                      )}

                      {/* 축제 */}
                      {selectedCategory === 'festivals' && (
                        <>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                            🎉 {currentCity} 진행 중인 축제
                          </h3>
                          {currentCityData.festivals && currentCityData.festivals.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                              {currentCityData.festivals.slice(0, 4).map((festival, i) => (
                                <div
                                  key={i}
                                  className="card"
                                  style={{ padding: '16px', cursor: 'pointer' }}
                                  onClick={() => setSelectedFestival(festival)}
                                >
                                  <CardImage src={festival.firstimage} alt={festival.title} height="120px" />
                                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                    {festival.title}
                                  </div>
                                  {festival.eventstartdate && festival.eventenddate && (
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                      📅 {festival.eventstartdate} ~ {festival.eventenddate}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '48px', color: '#888', background: '#f8f9fa', borderRadius: '8px' }}>
                              진행 중인 축제가 없습니다
                            </div>
                          )}
                        </>
                      )}

                      {/* 맛집 */}
                      {selectedCategory === 'restaurants' && (
                        <>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                            🥢 {currentCity} 추천 맛집
                          </h3>
                          {currentCityData.restaurants && currentCityData.restaurants.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                              {currentCityData.restaurants.slice(0, 4).map((restaurant, i) => (
                                <div
                                  key={i}
                                  className="card"
                                  style={{ padding: '16px', cursor: 'pointer' }}
                                  onClick={() => setSelectedTourItem(restaurant)}
                                >
                                  <CardImage src={restaurant.firstimage} alt={restaurant.title} height="120px" />
                                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                    {restaurant.title}
                                  </div>
                                  {restaurant.addr1 && (
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                      📍 {restaurant.addr1.split(' ').slice(-2).join(' ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '48px', color: '#888', background: '#f8f9fa', borderRadius: '8px' }}>
                              맛집 정보가 없습니다
                            </div>
                          )}
                        </>
                      )}

                      {/* 숙박 */}
                      {selectedCategory === 'hotels' && (
                        <>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                            🏨 {currentCity} 추천 숙박
                          </h3>
                          {currentCityData.hotels && currentCityData.hotels.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                              {currentCityData.hotels.slice(0, 4).map((hotel, i) => (
                                <div
                                  key={i}
                                  className="card"
                                  style={{ padding: '16px', cursor: 'pointer' }}
                                  onClick={() => setSelectedTourItem(hotel)}
                                >
                                  <CardImage src={hotel.firstimage} alt={hotel.title} height="120px" />
                                  <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                    {hotel.title}
                                  </div>
                                  {hotel.addr1 && (
                                    <div style={{ fontSize: '11px', color: '#666' }}>
                                      📍 {hotel.addr1.split(' ').slice(-2).join(' ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '48px', color: '#888', background: '#f8f9fa', borderRadius: '8px' }}>
                              숙박 정보가 없습니다
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 전체 축제 */}
      <div ref={festivalSectionRef}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
          🎉 강원도 진행 중인 축제
        </h2>
        <div className="grid-3">
          {(() => {
            const today = new Date();
            const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

            const activeFestivals = festivals?.filter(festival => {
              if (!festival.eventenddate) return false;
              return festival.eventenddate >= todayStr;
            }) || [];

            return activeFestivals.length > 0 ? (
              <>
                {activeFestivals.slice(0, festivalsToShow).map((festival, i) => (
                  <div 
                    key={i} 
                    className="card festival-card"
                    onClick={() => setSelectedFestival(festival)}
                    style={{cursor: 'pointer'}}>
                    <CardImage src={festival.firstimage} alt={festival.title} height="160px" marginBottom="12px" />
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
                      {festival.title}
                    </h3>
                    {festival.addr1 && (
                      <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                        📍 {festival.addr1}
                      </p>
                    )}
                    {festival.eventstartdate && festival.eventenddate && (
                      <p style={{ fontSize: '12px', color:'#666'}}>
                        📅 {festival.eventstartdate} ~ {festival.eventenddate}
                      </p>
                    )}
                  </div>
                ))}
                {festivalsToShow < activeFestivals.length && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '16px' }}>
                    <button
                      onClick={handleLoadMore}
                      style={{
                        padding: '12px 32px',
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#333',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f5f5f5';
                        e.target.style.borderColor = '#1976d2';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#ddd';
                      }}
                    >
                      더보기 ({Math.min(5, activeFestivals.length - festivalsToShow)}개 더) ▼
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: '#888', gridColumn: '1 / -1' }}>
                현재 진행 중인 축제가 없습니다
              </div>
            );
          })()}
        </div>
      </div>

      {/* 위로가기 */}
      {showScrollTop && (
        <button
          onClick={scrollTop}
          style={{
            position: 'fixed',
            bottom: '40px',
            right: '40px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2D6A4F 0%, #1565C0 100%)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) =>{
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) =>{
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
          }}>
            ↑
          </button>
      )}

      {/* 상세 모달 */}
      {selectedFestival && (
        <FestivalModal
          festival={selectedFestival}
          onClose={() => setSelectedFestival(null)}
        />
      )}
      {selectedTourItem && (
        <TourDetailModal
          item={selectedTourItem}
          onClose={() => setSelectedTourItem(null)}
        />
      )}
    </div>
  );
}