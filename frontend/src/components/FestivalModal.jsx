import React, { useEffect } from 'react';
import { useFestivalDetail } from '../hooks/useTravel';
import CardImage from './CardImage';

export default function FestivalModal({ festival, onClose }) {
    const {data : detail } = useFestivalDetail(festival.contentid);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 카카오맵 
  useEffect(() => {
    if (!festival.mapx || !festival.mapy) {
      console.log('좌표 없음');
      return;
    }

    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        console.error('카카오맵 SDK 없음');
        return;
      }

      window.kakao.maps.load(() => {
        try {
          const container = document.getElementById('festival-map');
          if (!container) {
            console.error('지도 컨테이너 없음');
            return;
          }

          const lat = parseFloat(festival.mapy);
          const lng = parseFloat(festival.mapx);


          const options = {
            center: new window.kakao.maps.LatLng(lat, lng),
            level: 3,
          };

          const map = new window.kakao.maps.Map(container, options);

          // 마커 추가
          const markerPosition = new window.kakao.maps.LatLng(lat, lng);
          const marker = new window.kakao.maps.Marker({
            position: markerPosition,
          });
          marker.setMap(map);

        } catch (error) {
          console.error('❌ 지도 생성 에러:', error);
        }
      });
    };

    // SDK 로드 확인
    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkInterval);
          initMap();
        } else if (attempts > 50) {
          clearInterval(checkInterval);
          console.error('카카오맵 SDK 로드 타임아웃');
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [festival]);

  return (
    <div
      style={{
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
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
          }}
        >
          ✕
        </button>

        <div>
          {/* 대표 이미지 */}
          <CardImage
            src={festival.firstimage}
            alt={festival.title}
            height="300px"
            radius="16px 16px 0 0"
            marginBottom="0"
          />

          <div style={{ padding: '32px' }}>
            {/* 제목 */}
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
              {festival.title}
            </h2>

            {/* 기간 */}
            {festival.eventstartdate && festival.eventenddate && (
              <div style={{ 
                fontSize: '16px', 
                color: '#666', 
                marginBottom: '24px',
                padding: '12px',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                📅 {festival.eventstartdate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')} ~ {festival.eventenddate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}
              </div>
            )}

            {/* 주소 */}
            {festival.addr1 && (
              <div style={{ 
                fontSize: '15px', 
                color: '#666', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span>📍</span>
                <span>{festival.addr1}</span>
              </div>
            )}

            {/* 전화번호 */}
            {festival.tel && (
              <div style={{ 
                fontSize: '15px', 
                color: '#666', 
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>📞</span>
                <span>{festival.tel}</span>
              </div>
            )}

            {/* 주차 정보 */}
            {detail?.parking ? (
                <div style={{ 
                    fontSize: '15px', 
                    color: '#666', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                }}>
                <span>🅿️</span>
                <span>{detail.parking}</span>
                </div>
            ) : (
                <div style={{ 
                    fontSize: '15px', 
                    color: '#999', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                }}>
                <span>🅿️</span>
                <span>주차 정보는 전화로 문의해주세요</span>
                </div>
            )}

            {/* 이용시간 */}
            {detail?.playtime && (
                <div style={{ 
                    fontSize: '15px', 
                    color: '#666', 
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                }}>
                <span>⏰</span>
                <span>운영시간 : {detail.playtime}</span>
                </div>
            )}

            {/* 요금 정보 */}
            {detail?.usetimefestival ? (
                <div style={{
                    fontSize: '15px', 
                    color: '#666',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                }}>
                    <span>💰</span>
                    <div>
                        <div style={{ fontWeight: 700, color: '#1565C0', marginBottom: '4px' }}>이용요금</div>
                        <div dangerouslySetInnerHTML={{ __html: detail.usetimefestival }} />
                    </div>
                </div>
            ) : (
                <div style={{
                    fontSize: '15px', 
                    color: '#666',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '12px',
                }}>
                    <span>💰</span>
                    <span>요금 정보는 전화로 문의해주세요</span>
                </div>
            )}

            {/* 상세 정보 */}
            {detail?.overview && (
                <div style={{ marginBottom: '24px'}}>
                    <h3 style={{fontSize: '18px', fontWeight: 700, marginBottom: '12px'}}>상세 정보</h3>
                    <p style={{fontSize: '15px', lineHeight: '1.8', color: '#333', whiteSpace: 'pre-wrap'}}>{detail.overview}</p>
                </div>
            )}
          

            {/* 카카오맵 */}
            {festival.mapx && festival.mapy && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                  위치
                </h3>
                <div
                  id="festival-map"
                  style={{
                    width: '100%',
                    height: '300px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: '#f0f0f0',
                  }}
                />
              </div>
            )}

            {/* 카카오맵 길찾기 버튼 */}
            {festival.mapx && festival.mapy && (
              <a
                href={`https://map.kakao.com/link/to/${festival.title},${festival.mapy},${festival.mapx}`}
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
                }}
              >
                🚗 카카오맵 길찾기
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}