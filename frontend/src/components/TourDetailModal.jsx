import React, { useEffect } from 'react';
import { useTourDetail } from '../hooks/useTravel';
import { href } from 'react-router-dom';

export default function TourDetailModal({ item, onClose }) {
  const { data: detail, isLoading } = useTourDetail(item.contentid, item.contenttypeid);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 카카오맵 초기화
  useEffect(() => {
    const mapx = detail?.mapx || item.mapx;
    const mapy = detail?.mapy || item.mapy;

    if (!mapx || !mapy) return;

    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) return;

      window.kakao.maps.load(() => {
        try {
          const container = document.getElementById('tour-detail-map');
          if (!container) return;

          const lat = parseFloat(mapy);
          const lng = parseFloat(mapx);

          const options = {
            center: new window.kakao.maps.LatLng(lat, lng),
            level: 3,
          };

          const map = new window.kakao.maps.Map(container, options);

          const markerPosition = new window.kakao.maps.LatLng(lat, lng);
          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
          });
          marker.setMap(map);
        } catch (error) {
          console.error('지도 생성 에러:', error);
        }
      });
    };

    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkInterval);
          initMap();
        }
      }, 100);

      setTimeout(() => clearInterval(checkInterval), 5000);
      return () => clearInterval(checkInterval);
    }
  }, [detail, item]);

 

  // 정보 렌더링
  const renderTypeSpecificInfo = () =>{
    const typeId = item.contenttypeid;

    if(typeId === '12'){
        return (
            <>
                {/* 번호 */}
                {item.tel && (
                    <div style={{
                        fontSize: '15px', 
                        color: '#666', 
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📞</span>
                        <span>{item.tel}</span>
                    </div>
                )}


            </>
        );
    }

    if (typeId === '39'){
        return(
            <>
                {/* 번호 */}
                {item.tel && (
                    <div style={{
                        fontSize: '15px', 
                        color: '#666',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>📞</span>
                        <span>{item.tel}</span>
                    </div>
                )}


                {/* 시간 */}
                {detail?.opentimefood && (
                    <div style={{
                        fontSize: '15px', 
                        color: '#666', 
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                    }}>
                        <span>⏰</span>
                        <div>
                            <span style={{ fontWeight: 600 }}>영업시간: </span>
                            <span dangerouslySetInnerHTML={{ __html: detail.opentimefood }} />
                        </div>
                    </div>
                )}

            </>
        );
    }

    if(typeId === '32'){
        const titleQuery = encodeURIComponent(`${item.title} ${item.addr1 || ''}`);
        const city = item.addr1?.split(' ')[1] || '강원';
        const cityQuery = encodeURIComponent(city);

        return(
            <>
                {/* 전화번호 */}
                {item.tel && (
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                            📞 예약 문의
                        </div>
                        <span>{item.tel}</span>
                    </div>
                )}

                {/* 예약 정보 */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                        🔍 예약 정보 찾기
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
                        <a href={`https://search.naver.com/search.naver?query=${titleQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '10px',
                                background: '#52C41A',
                                color: 'white',
                                borderRadius: '8px',
                                textAlign: 'center',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '13px',
                            }}>
                                네이버 플레이스
                            </a>
                            <a href={`https://map.kakao.com/link/search/${titleQuery}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '10px',
                                    background: '#FEE500',
                                    color: '#000',
                                    borderRadius: '8px',
                                    textAlign: 'center',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                }}>
                                    카카오맵
                                </a>
                    </div>

                    {/* 지역기반 숙소 검색 */}
                    <div style={{ fontSize: '13px', color: '#464646', marginBottom: '4px' }}>
                        {city} 지역 숙소 보기
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <a href={`https://www.yanolja.com/search/${cityQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '10px',
                                background: '#FF0057',
                                color: 'white',
                                borderRadius: '8px',
                                textAlign: 'center',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '13px',
                            }}>
                                야놀자
                        </a>
                        <a href={`https://www.goodchoice.kr/product/search?keyword=${cityQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '10px',
                                background: '#5D5FEF',
                                color: 'white',
                                borderRadius: '8px',
                                textAlign: 'center',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '13px',
                            }}>
                                여기어때
                            </a>
                    </div>
                </div>
            </>
        );
    }
    return null;
  };

  return(
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
    }}
    onClick={onClose}>
        <div style={{
            background: 'white',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}>
            <button onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    fontSize: '20px',
                    cursor: 'pointer',
                    zIndex: 10,
                }}>
                    ✕
                </button>
                {isLoading ? (
                    <div style={{padding: '48px', textAlign: 'center', color: '#666'}}>
                        로딩 중...
                    </div>
                ) : (
                    <div>
                        {item.firstimage && (
                            <img src={item.firstimage}
                                alt={item.title}
                                style={{
                                    width: '100%',
                                    height: '300px',
                                    objectFit: 'cover',
                                    borderRadius: '16px 16px 0 0',
                                }}/>
                        )}
                        <div style={{padding: '32px'}}>
                            <h2 style={{fontSize: '28px', fontWeight: 700, marginBottom: '16px'}}>
                                {item.title}
                            </h2>

                            {/* 주소 */}
                            {item.addr1 && (
                                <div style={{
                                    fontSize: '15px', 
                                    color: '#666', 
                                    marginBottom: '24px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px'
                                }}>
                                    <span>📍</span>
                                    <span>{item.addr1}</span>

                                </div>  
                            )}

                            {/* 타입별 정보 */}
                            {renderTypeSpecificInfo()}

                            {/* 상세설명 */}
                            {detail?.overview && (
                                <div style={{marginBottom: '24px' }}>
                                    <h3 style={{fontSize: '18px', fontWeight: 700, marginBottom: '12px'}}>
                                        상세 정보
                                    </h3>
                                    <p style={{
                                        fontSize: '15px', 
                                        lineHeight: '1.8', 
                                        color: '#333',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {detail.overview}
                                    </p>
                                </div>
                            )}

                            {/* 지도 */}
                            {(detail?.mapx || item.mapx) && (detail?.mapy || item.mapy) && (
                                <div style={{ marginBottom: '24px'}}>
                                    <h3 style={{fontSize: '18px', fontWeight: 700, marginBottom: '12px'}}>
                                        위치
                                    </h3>
                                    <div id="tour-detail-map"
                                        style={{
                                            width: '100%',
                                            height: '300px',
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            background: '#f0f0f0',
                                        }}/>
                                </div>
                            )}

                            {/* 길찾기 */}
                            {(detail?.mapx || item.mapx) && (detail?.mapy || item.mapy) && (
                                <a
                                href={`https://map.kakao.com/link/to/${item.title},${detail?.mapy || item.mapy},${detail?.mapx || item.mapx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '16px',
                                    background: '#FEE500',
                                    color: '#000',
                                    textAlign: 'center',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                }}>
                                    🚗 카카오맵 길찾기
                                </a>
                            )}
                        </div>
                    </div>
                )}
        </div>
    </div>
  )
  
}