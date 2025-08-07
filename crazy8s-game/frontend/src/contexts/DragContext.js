import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const DragContext = createContext({
  isDragging: false,
  draggedCards: [],
  dragPosition: { x: 0, y: 0 },
  dragOffset: { x: 0, y: 0 },
  dropZoneActive: null,
  isReturning: false,
  returnPosition: null,
  originalPosition: null,
  startDrag: () => {},
  updateDragPosition: () => {},
  endDrag: () => {},
  setDropZoneActive: () => {},
  getDragPreviewStyle: () => ({}),
  returnToOriginalPosition: () => {},
});

export const DragProvider = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCards, setDraggedCards] = useState([]);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropZoneActive, setDropZoneActive] = useState(null);
  const [isReturning, setIsReturning] = useState(false);
  const [returnPosition, setReturnPosition] = useState(null);
  const [originalPosition, setOriginalPosition] = useState(null);
  
  // Ref to track initial mouse position relative to the clicked card
  const initialMousePos = useRef({ x: 0, y: 0 });
  const returnAnimationRef = useRef(null);
  
  // Start dragging with selected cards
  const startDrag = useCallback((cards, event, clickedElement) => {
    if (!cards || cards.length === 0) {
      console.log('🔴 startDrag: No cards provided');
      return;
    }
    
    console.log('🚀 DragContext.startDrag received:', {
      cardCount: cards.length,
      cards: cards.map(c => ({
        display: `${c.rank}${c.suit[0]}`,
        id: c.id,
        rank: c.rank,
        suit: c.suit
      }))
    });
    
    // Cancel any ongoing return animation
    if (returnAnimationRef.current) {
      cancelAnimationFrame(returnAnimationRef.current);
      returnAnimationRef.current = null;
    }
    
    // Calculate offset from the clicked element
    const rect = clickedElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    
    // Store original position for potential return animation
    setOriginalPosition({
      x: rect.left + offsetX,
      y: rect.top + offsetY
    });
    
    console.log('🔧 Setting draggedCards to:', cards);
    setDraggedCards(cards);
    setIsDragging(true);
    setIsReturning(false);
    setReturnPosition(null);
    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ x: event.clientX, y: event.clientY });
    
    initialMousePos.current = { x: event.clientX, y: event.clientY };
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    
    console.log('✅ Drag state updated - isDragging will be true');
  }, []);
  
  // Update drag position as mouse moves with throttling
  const updateDragPosition = useCallback((event) => {
    if (!isDragging) return;
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      setDragPosition({
        x: event.clientX,
        y: event.clientY
      });
    });
  }, [isDragging]);
  
  // Return cards to original position with animation
  const returnToOriginalPosition = useCallback((onComplete) => {
    if (!originalPosition || !dragPosition) {
      if (onComplete) onComplete();
      return;
    }
    
    setIsReturning(true);
    setIsDragging(false);
    
    const startPos = { ...dragPosition };
    const endPos = { ...originalPosition };
    const duration = 300; // ms
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startPos.x + (endPos.x - startPos.x) * easeOut;
      const currentY = startPos.y + (endPos.y - startPos.y) * easeOut;
      
      setReturnPosition({ x: currentX, y: currentY });
      
      if (progress < 1) {
        returnAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setIsReturning(false);
        setReturnPosition(null);
        setDraggedCards([]);
        setDragPosition({ x: 0, y: 0 });
        setDragOffset({ x: 0, y: 0 });
        setDropZoneActive(null);
        setOriginalPosition(null);
        
        // Restore cursor
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        
        if (onComplete) onComplete();
      }
    };
    
    returnAnimationRef.current = requestAnimationFrame(animate);
  }, [dragPosition, originalPosition]);
  
  // End dragging
  const endDrag = useCallback((shouldReturn = false, onComplete) => {
    if (shouldReturn) {
      returnToOriginalPosition(onComplete);
      return;
    }
    
    setIsDragging(false);
    setIsReturning(false);
    setDraggedCards([]);
    setDragPosition({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
    setDropZoneActive(null);
    setReturnPosition(null);
    setOriginalPosition(null);
    
    // Restore cursor
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    if (onComplete) onComplete();
  }, [returnToOriginalPosition]);
  
  // Get style for drag preview
  const getDragPreviewStyle = useCallback(() => {
    if (!isDragging && !isReturning) return { display: 'none' };
    
    // Use return position during animation, otherwise use drag position
    const currentPosition = isReturning && returnPosition ? returnPosition : dragPosition;
    
    return {
      position: 'fixed',
      left: `${currentPosition.x - dragOffset.x}px`,
      top: `${currentPosition.y - dragOffset.y}px`,
      pointerEvents: 'none',
      zIndex: 1000,
      opacity: isReturning ? 0.6 : 0.8,
      transform: isReturning ? 'rotate(0deg) scale(0.95)' : 'rotate(-5deg)',
      transition: isReturning ? 'transform 0.2s ease-out' : 'none',
    };
  }, [isDragging, isReturning, dragPosition, returnPosition, dragOffset]);
  
  const value = {
    isDragging,
    draggedCards,
    dragPosition,
    dragOffset,
    dropZoneActive,
    isReturning,
    returnPosition,
    originalPosition,
    startDrag,
    updateDragPosition,
    endDrag,
    setDropZoneActive,
    getDragPreviewStyle,
    returnToOriginalPosition,
  };
  
  return (
    <DragContext.Provider value={value}>
      {children}
    </DragContext.Provider>
  );
};

export const useDrag = () => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
};

export default DragContext;