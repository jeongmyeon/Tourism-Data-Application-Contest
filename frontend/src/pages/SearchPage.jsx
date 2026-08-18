import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTourSearch } from '../hooks/useTravel';
import TourDetailModal from '../components/TourDetailModal';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get('q') || '';
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () =>{
        if(window.scrollY>300){
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

  // 검색
  const [searchInput, setSearchInput] = useState(keyword);
  
  // 카테고리별 표시 개수
  const [spotsCount, setSpotsCount] = useState(3);
  const [foodCount, setFoodCount] = useState(3);
  const [lodgingCount, setLodgingCount] = useState(3);

  // 모달용
  const [selectedItem, setSelectedItem] = useState(null);
  
  const { data: results, isLoading } = useTourSearch(keyword);

  // 검색 핸들러
  const handleSearch = (e) => {
    e.preventDefault();
    if(searchInput.trim().length >= 2){
        navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
        setSpotsCount(3);
        setFoodCount(3);
        setLodgingCount(3);
    }
  };

  const handleLoadMore = (category,currentCount, setCount) =>{
    setCount(prev => prev +3);
    setTimeout(() =>{
        const cards = document.querySelectorAll(`.${category}`);
        
        if (cards[currentCount]){
            cards[currentCount].scrollIntoView({
                behavior: 'smooth', 
                block: 'center' 
            });
        }else{
            console.log('❌ 카드를 찾을 수 없음');
        }
    },100);   
  }

  // 카테고리별 분류
  const categorized = useMemo(() => {
    if (!results) return { spots: [], food: [], lodging: [] };
    
    return {
      spots: results.filter(item => item.contenttypeid === '12'), // 관광지
      food: results.filter(item => item.contenttypeid === '39'), // 음식점
      lodging: results.filter(item => item.contenttypeid === '32'), // 숙박
    };
  }, [results]);

  // 카드 렌더링
  const renderCard = (item, index, categoryClass) => (
    <div
      key={index}
      className={categoryClass}
      onClick={() => setSelectedItem(item)}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        cursor : 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      {item.firstimage && (
        <img
          src={item.firstimage}
          alt={item.title}
          style={{
            width: '240px',
            height: '180px',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ padding: '20px', flex: 1 }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>
          {item.title}
        </h3>

        {item.addr1 && (
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            📍 {item.addr1}
          </p>
        )}

        {item.tel && (
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            📞 {item.tel}
          </p>
        )}

        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: '#e3f2fd',
            color: '#1976d2',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 600,
            marginTop: '8px',
          }}
        >
          {getContentTypeName(item.contenttypeid)}
        </span>
      </div>
    </div>
  );

  // 카테고리 섹션 렌더링
  const renderCategory = (title, items, displayCount, setDisplayCount, categoryClass) => {
    if (items.length === 0) return null;

    const displayItems = items.slice(0, displayCount);
    const hasMore = displayCount < items.length;
    
    return (
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
          {title} ({items.length})
        </h2>
        <div style={{ display: 'grid', gap: '24px', marginBottom: '16px' }}>
          {displayItems.map((item, index) => renderCard(item, index, categoryClass))}
        </div>
        
        {hasMore && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => handleLoadMore(categoryClass, displayCount, setDisplayCount)}
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
              더보기 ({Math.min(3, items.length - displayCount)}개 더) ▼
            </button>
          </div>
        )}
      </div>
    );
  };

  const totalResults = (categorized.spots?.length || 0) + 
                       (categorized.food?.length || 0) + 
                       (categorized.lodging?.length || 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* 검색 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          ← 뒤로가기
        </button>
        {/* 검색창 */}
        <form onSubmit={handleSearch} style={{ marginBottom: '24px'}}>
            <div style={{display: 'flex', gap:'8px', maxWidth: '600px'}}>
                <input 
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="다시 검색..."
                    style={{
                        flex: 1,
                        padding:'12px 16px',
                        fontSize: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        outline: 'none',
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#1976d2';
                    }}
                    onBlur={(e) =>{
                        e.target.style.borderColor = '#ddd';
                    }}/>
                    <button
                        type="submit"
                        style={{
                            padding: '12px 24px',
                            background: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                        }} > 
                        검색
                    </button>
            </div>
        </form>
        
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          "{keyword}" 검색 결과
        </h1>
        
        {!isLoading && results && (
          <p style={{ fontSize: '16px', color: '#666' }}>
            총 {totalResults}개의 결과
          </p>
        )}
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '48px', color: '#666' }}>
          검색 중...
        </div>
      )}

      {/* 카테고리별 결과 */}
      {!isLoading && totalResults > 0 ? (
        <>
          {renderCategory('🏔️ 관광지', categorized.spots, spotsCount, setSpotsCount,'spots-card')}
          {renderCategory('🍽️ 음식점', categorized.food, foodCount, setFoodCount, 'food-card')}
          {renderCategory('🏨 숙박', categorized.lodging, lodgingCount, setLodgingCount,'lodging-card')}
        </>
      ) : !isLoading && keyword ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
          "{keyword}" 검색 결과가 없습니다
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', color: '#888' }}>
          검색어를 입력해주세요
        </div>
      )}
      {/* 모달 */}
        {selectedItem && (
            <TourDetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        )}
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
    </div>
  );
}

function getContentTypeName(typeId) {
  const types = {
    '12': '관광지',
    '32': '숙박',
    '39': '음식점',
  };
  return types[typeId] || '기타';
}