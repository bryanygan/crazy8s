import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const CardSortingPreferences = ({ settings, onSettingsChange, theme, onShowToast }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Default card rank order
    const defaultRankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];

    // Initialize rank order from settings or use defaults
    const [rankOrder, setRankOrder] = useState(() => {
        if (settings.cardSortingPreferences?.customRankOrder) {
            return settings.cardSortingPreferences.customRankOrder;
        }
        return defaultRankOrder;
    });

    // Grouping option state
    const [groupNormalNumbers, setGroupNormalNumbers] = useState(() => {
        return settings.cardSortingPreferences?.groupNormalNumbers || false;
    });

    // Include 8 in group option state (default to false)
    const [includeEightInGroup, setIncludeEightInGroup] = useState(() => {
        return settings.cardSortingPreferences?.includeEightInGroup || false;
    });

    // Force re-render key for drag-drop context
    const [dndKey, setDndKey] = useState(0);

    const ITEMS_PER_ROW = 13; // All cards in one row

    // Convert display items back to rank order
    const getRankOrderFromItems = (items) => {
        const newOrder = [];
        items.forEach(item => {
            if (item.type === 'group') {
                newOrder.push(...item.ranks);
            } else {
                newOrder.push(item.rank);
            }
        });
        return newOrder;
    };

    // Handle drag end
    const onDragEnd = (result) => {
        const { source, destination } = result;

        // Dropped outside the list
        if (!destination) {
            return;
        }

        const newDisplayItems = [...displayItems];
        const [moved] = newDisplayItems.splice(source.index, 1);
        newDisplayItems.splice(destination.index, 0, moved);

        // Convert back to rank order
        const newOrder = getRankOrderFromItems(newDisplayItems);

        setRankOrder(newOrder);
        updateSettings(newOrder);
        onShowToast('Card order updated successfully!', 'success');
    };

    // Update settings
    const updateSettings = (newRankOrder) => {
        const updatedSettings = {
            ...settings,
            cardSortingPreferences: {
                customRankOrder: newRankOrder,
                groupNormalNumbers: groupNormalNumbers,
                includeEightInGroup: includeEightInGroup
            }
        };
        onSettingsChange(updatedSettings);
    };

    // Reset to defaults
    const resetToDefaults = () => {
        setRankOrder(defaultRankOrder);
        setGroupNormalNumbers(false);
        setIncludeEightInGroup(false);
        updateSettings(defaultRankOrder);
        onShowToast('Card order reset to defaults', 'info');
    };

    // Handle grouping toggle
    const handleGroupingToggle = () => {
        const newGrouping = !groupNormalNumbers;
        setGroupNormalNumbers(newGrouping);
        
        // Update settings with new grouping preference
        const updatedSettings = {
            ...settings,
            cardSortingPreferences: {
                customRankOrder: rankOrder,
                groupNormalNumbers: newGrouping,
                includeEightInGroup: includeEightInGroup
            }
        };
        onSettingsChange(updatedSettings);
        onShowToast(newGrouping ? 'Normal numbers grouped together' : 'Normal numbers ungrouped', 'success');
        
        // Force re-render of drag-drop context after state update
        setTimeout(() => setDndKey(prev => prev + 1), 0);
    };

    // Handle include 8 toggle
    const handleIncludeEightToggle = () => {
        const newIncludeEight = !includeEightInGroup;
        setIncludeEightInGroup(newIncludeEight);
        
        // Update settings with new include 8 preference
        const updatedSettings = {
            ...settings,
            cardSortingPreferences: {
                customRankOrder: rankOrder,
                groupNormalNumbers: groupNormalNumbers,
                includeEightInGroup: newIncludeEight
            }
        };
        onSettingsChange(updatedSettings);
        onShowToast(newIncludeEight ? '8 included in group' : '8 excluded from group', 'success');
        
        // Force re-render of drag-drop context after state update
        setTimeout(() => setDndKey(prev => prev + 1), 0);
    };


    // Get card display properties
    const getCardDisplayInfo = (rank) => {
        const cardInfo = {
            '2': { display: '2', description: 'Two', color: '#4a90e2' },
            '3': { display: '3', description: 'Three', color: '#4a90e2' },
            '4': { display: '4', description: 'Four', color: '#4a90e2' },
            '5': { display: '5', description: 'Five', color: '#4a90e2' },
            '6': { display: '6', description: 'Six', color: '#4a90e2' },
            '7': { display: '7', description: 'Seven', color: '#4a90e2' },
            '8': { display: '8', description: 'Eight (Wild)', color: '#9b59b6' },
            '9': { display: '9', description: 'Nine', color: '#4a90e2' },
            '10': { display: '10', description: 'Ten', color: '#4a90e2' },
            'Jack': { display: 'J', description: 'Jack (Skip)', color: '#f5a623' },
            'Queen': { display: 'Q', description: 'Queen (Reverse)', color: '#f5a623' },
            'King': { display: 'K', description: 'King', color: '#4a90e2' },
            'Ace': { display: 'A', description: 'Ace (+1 Card)', color: '#d0021b' }
        };
        return cardInfo[rank] || { display: rank, description: rank, color: '#95a5a6' };
    };

    const displayItems = useMemo(() => {
        // Normal numbers that can be grouped (dynamically includes/excludes 8)
        const normalNumbers = includeEightInGroup ? ['3', '4', '5', '6', '7', '8', '9', '10'] : ['3', '4', '5', '6', '7', '9', '10'];
        
        if (!groupNormalNumbers) {
            return rankOrder.map(rank => ({ type: 'individual', rank, id: rank }));
        }

        const items = [];
        let groupCreated = false;
        let i = 0;
        
        while (i < rankOrder.length) {
            const currentRank = rankOrder[i];
            
            if (normalNumbers.includes(currentRank)) {
                if (!groupCreated) {
                    // Create the group with ALL normal numbers from rankOrder
                    const allNormalNumbersInOrder = rankOrder.filter(rank => normalNumbers.includes(rank));
                    items.push({ 
                        type: 'group', 
                        ranks: allNormalNumbersInOrder, 
                        id: `group-normal-numbers`,
                        includesEight: includeEightInGroup
                    });
                    groupCreated = true;
                }
                // Skip this rank since it's already in the group
                i++;
            } else {
                items.push({ type: 'individual', rank: currentRank, id: currentRank });
                i++;
            }
        }
        return items;
    }, [rankOrder, groupNormalNumbers, includeEightInGroup]);

    return (
        <div style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius,
            marginBottom: theme.spacing.medium,
            backgroundColor: theme.colors.background
        }}>
            {/* Header */}
            <div 
                style={{
                    padding: theme.spacing.medium,
                    borderBottom: isExpanded ? `1px solid ${theme.colors.border}` : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isExpanded ? 'rgba(74, 144, 226, 0.05)' : 'transparent'
                }}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <div style={{ fontWeight: 'bold', color: theme.colors.text }}>
                        Card Sorting Preferences
                    </div>
                    <div style={{ fontSize: '12px', color: theme.colors.secondary, marginTop: '2px' }}>
                        Customize how your cards are organized when sorting by rank
                    </div>
                </div>
                <div style={{ 
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '20px',
                    color: theme.colors.secondary
                }}>
                    ▼
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div style={{ padding: theme.spacing.medium }}>
                    {/* Grouping Toggle */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: theme.spacing.small,
                        backgroundColor: 'rgba(74, 144, 226, 0.05)',
                        borderRadius: theme.borderRadius,
                        marginBottom: theme.spacing.medium
                    }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: theme.colors.text }}>
                                Group Normal Numbers
                            </div>
                            <div style={{ fontSize: '12px', color: theme.colors.secondary }}>
                                Group 3-10 together for easier reordering
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={groupNormalNumbers}
                                onChange={handleGroupingToggle}
                                style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                            />
                        </label>
                    </div>

                    {/* Include 8 in Group Toggle - only show when grouping is enabled */}
                    {groupNormalNumbers && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: theme.spacing.small,
                            backgroundColor: 'rgba(155, 89, 182, 0.05)',
                            border: '1px solid rgba(155, 89, 182, 0.2)',
                            borderRadius: theme.borderRadius,
                            marginBottom: theme.spacing.medium,
                            marginLeft: theme.spacing.medium
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px', color: theme.colors.text }}>
                                    Include 8 in Group
                                </div>
                                <div style={{ fontSize: '12px', color: theme.colors.secondary }}>
                                    Include the wild 8 card in the 3-10 group
                                </div>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={includeEightInGroup}
                                    onChange={handleIncludeEightToggle}
                                    style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                                />
                            </label>
                        </div>
                    )}

                    {/* Instructions */}
                    <div style={{
                        backgroundColor: 'rgba(245, 166, 35, 0.1)',
                        border: '1px solid rgba(245, 166, 35, 0.3)',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.small,
                        marginBottom: theme.spacing.medium,
                        fontSize: '13px',
                        color: theme.colors.text
                    }}>
                        <strong>💡 How to use:</strong>
                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            <li>Drag individual cards or groups to reorder them in your preferred sequence</li>
                            <li>Cards will appear in your hand in the order you set here</li>
                            <li>Changes apply instantly when sorting by rank is enabled</li>
                            {groupNormalNumbers && (
                                <li><strong>Grouping enabled:</strong> Numbers 3-10 are grouped together{includeEightInGroup ? ' (including 8)' : ' (excluding 8)'}</li>
                            )}
                        </ul>
                    </div>

                    {/* Card Rank Ordering */}
                    <div style={{ marginBottom: theme.spacing.medium }}>
                        <h4 style={{ 
                            margin: `0 0 ${theme.spacing.small} 0`,
                            color: theme.colors.text,
                            fontSize: '16px'
                        }}>
                            Card Order (Drag to Reorder)
                        </h4>
                        <div style={{ fontSize: '12px', color: theme.colors.secondary, marginBottom: theme.spacing.medium }}>
                            Drag cards or groups to set your preferred order from first to last
                        </div>

                        {/* Card Grid */}
                        <DragDropContext onDragEnd={onDragEnd} key={`dnd-${dndKey}`}>
                            <Droppable droppableId="rankOrder" direction="horizontal">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        style={{ 
                                            display: groupNormalNumbers ? 'flex' : 'grid',
                                            flexWrap: groupNormalNumbers ? 'nowrap' : 'nowrap',
                                            gridTemplateColumns: groupNormalNumbers ? 'none' : `repeat(${ITEMS_PER_ROW}, 1fr)`,
                                            gap: groupNormalNumbers ? '2px' : theme.spacing.small,
                                            marginBottom: theme.spacing.medium,
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            justifyContent: groupNormalNumbers ? 'space-between' : 'center',
                                            alignItems: 'center',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {displayItems.map((item, index) => {
                                            if (item.type === 'group') {
                                                return (
                                                    <Draggable key={item.id} draggableId={item.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    backgroundColor: snapshot.isDragging ? 'rgba(74, 144, 226, 0.1)' : theme.colors.background,
                                                                    border: `2px solid ${snapshot.isDragging ? '#4a90e2' : 'rgba(0,0,0,0.1)'}`,
                                                                    borderRadius: theme.borderRadius,
                                                                    padding: '6px 2px',
                                                                    cursor: 'grab',
                                                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                                                    minHeight: '60px',
                                                                    minWidth: '50px',
                                                                    flex: '1',
                                                                    maxWidth: 'none',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    textAlign: 'center',
                                                                    position: 'relative',
                                                                    boxSizing: 'border-box',
                                                                    margin: '0',
                                                                    ...provided.draggableProps.style
                                                                }}
                                                            >
                                                                {/* Drag Handle */}
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '2px',
                                                                    right: '2px',
                                                                    color: theme.colors.secondary,
                                                                    fontSize: '10px',
                                                                    cursor: 'grab'
                                                                }}>
                                                                    ⋮⋮
                                                                </div>

                                                                {/* Group Display */}
                                                                <div style={{
                                                                    fontSize: '14px',
                                                                    fontWeight: 'bold',
                                                                    color: '#4a90e2',
                                                                    marginBottom: '2px'
                                                                }}>
                                                                    3-10
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '8px',
                                                                    color: theme.colors.secondary
                                                                }}>
                                                                    
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            } else {
                                                const cardInfo = getCardDisplayInfo(item.rank);
                                                return (
                                                    <Draggable key={item.rank} draggableId={item.rank} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    backgroundColor: snapshot.isDragging ? 'rgba(74, 144, 226, 0.1)' : theme.colors.background,
                                                                    border: `2px solid ${snapshot.isDragging ? cardInfo.color : 'rgba(0,0,0,0.1)'}`,
                                                                    borderRadius: theme.borderRadius,
                                                                    padding: groupNormalNumbers ? '6px 2px' : '8px 4px',
                                                                    cursor: 'grab',
                                                                    opacity: snapshot.isDragging ? 0.8 : 1,
                                                                    minHeight: groupNormalNumbers ? '60px' : '60px',
                                                                    minWidth: groupNormalNumbers ? '50px' : '0',
                                                                    maxWidth: groupNormalNumbers ? 'none' : '80px',
                                                                    flex: groupNormalNumbers ? '1' : 'none',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    textAlign: 'center',
                                                                    position: 'relative',
                                                                    boxSizing: 'border-box',
                                                                    margin: '0',
                                                                    ...provided.draggableProps.style
                                                                }}
                                                            >
                                                                {/* Drag Handle */}
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: groupNormalNumbers ? '2px' : '2px',
                                                                    right: groupNormalNumbers ? '2px' : '2px',
                                                                    color: theme.colors.secondary,
                                                                    fontSize: groupNormalNumbers ? '10px' : '10px',
                                                                    cursor: 'grab'
                                                                }}>
                                                                    ⋮⋮
                                                                </div>

                                                                {/* Card Display */}
                                                                <div style={{
                                                                    fontSize: groupNormalNumbers ? '20px' : '18px',
                                                                    fontWeight: 'bold',
                                                                    color: cardInfo.color,
                                                                    marginBottom: groupNormalNumbers ? '2px' : '2px'
                                                                }}>
                                                                    {cardInfo.display}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            }
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* Reset Button */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: theme.spacing.medium,
                        borderTop: `1px solid ${theme.colors.border}`
                    }}>
                        <div style={{ fontSize: '12px', color: theme.colors.secondary }}>
                            Changes are saved automatically
                        </div>
                        <button
                            onClick={resetToDefaults}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: theme.borderRadius,
                                color: theme.colors.secondary,
                                cursor: 'pointer',
                                fontSize: '12px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = 'rgba(0,0,0,0.05)';
                                e.target.style.color = theme.colors.text;
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.color = theme.colors.secondary;
                            }}
                        >
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CardSortingPreferences;
