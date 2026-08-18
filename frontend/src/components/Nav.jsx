import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/',        label: '홈',      icon: '🏔' },
];

export default function Nav() {
  const { pathname } = useLocation();

  return (
    <nav style={{
      background: '#1A2332',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      <Link to="/" style={{ textDecoration: 'none' }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
          🏔 강원 여행 가이드
        </span>
      </Link>
      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map(({ path, label, icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}