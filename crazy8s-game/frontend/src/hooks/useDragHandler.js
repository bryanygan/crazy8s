import { useEffect, useCallback } from 'react';
import { useDrag } from '../contexts/DragContext';

export const useDragHandler = (onDrop) => {
  const { isDragging, updateDragPosition, endDrag, dropZoneActive, draggedCards } = useDrag();
  
  const handleDrop = useCallback(() => {
    if (dropZoneActive && draggedCards.length > 0 && onDrop) {
      // Call onDrop and check if it returns success/failure
      const dropResult = onDrop(dropZoneActive, draggedCards);
      
      // If onDrop returns false, animate return to original position
      if (dropResult === false) {
        endDrag(true); // true = should return with animation
        return;
      }
    }
    
    // For successful drops or no drop zone, end drag normally
    endDrag(false);
  }, [dropZoneActive, draggedCards, onDrop, endDrag]);
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e) => {
      updateDragPosition(e);
    };
    
    const handleMouseUp = (e) => {
      // Check if we're over a drop zone
      if (dropZoneActive) {
        handleDrop();
      } else {
        // No drop zone - return to original position
        endDrag(true);
      }
    };
    
    // Add listeners to window to catch events outside the card
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateDragPosition, endDrag, dropZoneActive, handleDrop]);
};

export default useDragHandler;