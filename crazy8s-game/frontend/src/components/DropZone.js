import React, { useRef, useEffect, useState } from 'react';
import { useDrag } from '../contexts/DragContext';

const DropZone = ({ 
  id, 
  acceptCards = true, 
  onDrop,
  children,
  style = {},
  className = '',
  label = 'Drop Zone'
}) => {
  const [isOver, setIsOver] = useState(false);
  const dropZoneRef = useRef(null);
  const { isDragging, dragPosition, setDropZoneActive } = useDrag();
  
  useEffect(() => {
    if (!isDragging || !dropZoneRef.current) {
      setIsOver(false);
      return;
    }
    
    const checkIfOver = () => {
      const rect = dropZoneRef.current.getBoundingClientRect();
      const isInBounds = 
        dragPosition.x >= rect.left &&
        dragPosition.x <= rect.right &&
        dragPosition.y >= rect.top &&
        dragPosition.y <= rect.bottom;
      
      setIsOver(isInBounds);
      
      if (isInBounds) {
        setDropZoneActive(id);
      } else if (!isInBounds && isOver) {
        setDropZoneActive(null);
      }
    };
    
    // Check immediately
    checkIfOver();
    
    // Set up interval to check position
    const interval = setInterval(checkIfOver, 50);
    
    return () => clearInterval(interval);
  }, [isDragging, dragPosition, id, setDropZoneActive, isOver]);
  
  const getDropZoneStyle = () => {
    const baseStyle = {
      minHeight: '120px',
      minWidth: '80px',
      border: '2px dashed #bdc3c7',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#ecf0f1',
      transition: 'all 0.3s ease',
      position: 'relative',
      ...style
    };
    
    if (isOver && isDragging) {
      return {
        ...baseStyle,
        border: '3px solid #3498db',
        backgroundColor: '#e8f4fd',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
      };
    }
    
    if (isDragging && acceptCards) {
      return {
        ...baseStyle,
        border: '2px dashed #95a5a6',
        backgroundColor: '#f8f9fa'
      };
    }
    
    return baseStyle;
  };
  
  return (
    <div
      ref={dropZoneRef}
      className={`drop-zone ${className} ${isOver ? 'drop-zone-active' : ''}`}
      style={getDropZoneStyle()}
    >
      {!children && (
        <>
          <div style={{
            fontSize: '14px',
            color: isOver ? '#3498db' : '#7f8c8d',
            fontWeight: isOver ? 'bold' : 'normal',
            marginBottom: '10px'
          }}>
            {label}
          </div>
          {isDragging && (
            <div style={{
              fontSize: '12px',
              color: isOver ? '#2980b9' : '#95a5a6',
              textAlign: 'center'
            }}>
              {isOver ? 'Release to drop' : 'Drag cards here'}
            </div>
          )}
        </>
      )}
      {children}
    </div>
  );
};

export default DropZone;