import React from 'react';
import { CardSelectionProvider } from '../contexts/CardSelectionContext';
import { DragProvider } from '../contexts/DragContext';
import CardSelectionTest from './CardSelectionTest';
import DragPreview from './DragPreview';
import { useDragHandler } from '../hooks/useDragHandler';

// Wrapper component that uses the drag handler hook
const DragEnabledContent = () => {
  useDragHandler();
  
  return (
    <>
      <CardSelectionTest />
      <DragPreview />
    </>
  );
};

const CardDragTest = () => {
  return (
    <CardSelectionProvider>
      <DragProvider>
        <div>
          <h2>Card Drag Test</h2>
          <p>1. Select cards using click, Ctrl/Cmd+click, or Shift+click</p>
          <p>2. Drag selected cards by clicking and dragging any selected card</p>
          <p>3. Cards will follow your cursor as a stacked group</p>
          <DragEnabledContent />
        </div>
      </DragProvider>
    </CardSelectionProvider>
  );
};

export default CardDragTest;