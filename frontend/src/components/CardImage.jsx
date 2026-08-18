import React from 'react';

export default function CardImage({ src, alt, height = '120px', radius = '8px', marginBottom = '8px' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height,
          objectFit: 'cover',
          borderRadius: radius,
          marginBottom,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: radius,
        marginBottom,
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#aaa',
        fontSize: '13px',
        fontWeight: 600,
      }}
    >
      이미지 준비중...
    </div>
  );
}
