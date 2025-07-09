/**
 * ProgressSidebar.js - Shows tutorial progress and navigation
 * Displays module/lesson progress, navigation, and completion status
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Progress sidebar component for tutorial navigation and tracking
 * @param {Object} props - Component props
 * @param {Object} props.tutorialState - Current tutorial state
 * @param {Function} props.onToggle - Callback to toggle sidebar visibility
 * @param {Function} props.onNavigate - Callback for navigation actions
 * @param {Object} props.theme - Theme configuration
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {string} props.position - Sidebar position ('left' or 'right')
 */
const ProgressSidebar = ({
    tutorialState,
    onToggle,
    onNavigate,
    theme,
    isCollapsed = false,
    position = 'right'
}) => {
    // State management
    const [expandedModules, setExpandedModules] = useState(new Set());
    const [showDetails, setShowDetails] = useState(true);
    const [animationState, setAnimationState] = useState('idle');
    
    // Refs
    const sidebarRef = useRef(null);
    const scrollRef = useRef(null);
    
    /**
     * Initialize expanded modules
     */
    useEffect(() => {
        if (tutorialState.currentModule) {
            setExpandedModules(new Set([tutorialState.currentModule]));
        }
    }, [tutorialState.currentModule]);

    /**
     * Scroll to current lesson when it changes
     */
    useEffect(() => {
        if (tutorialState.currentLesson && scrollRef.current) {
            const currentLessonElement = scrollRef.current.querySelector(
                `[data-lesson-id="${tutorialState.currentLesson.id}"]`
            );
            
            if (currentLessonElement) {
                currentLessonElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }
        }
    }, [tutorialState.currentLesson]);

    /**
     * Get module progress percentage
     */
    const getModuleProgress = (moduleId) => {
        const progress = tutorialState.progress?.modules || {};
        const moduleProgress = progress[moduleId];
        
        if (!moduleProgress) return 0;
        
        const totalLessons = moduleProgress.totalLessons || 0;
        const completedLessons = moduleProgress.completedLessons || 0;
        
        return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    };

    /**
     * Get overall progress
     */
    const getOverallProgress = () => {
        const progress = tutorialState.progress;
        if (!progress || !progress.lessons) return 0;
        
        return progress.lessons.percentage || 0;
    };

    /**
     * Check if module is completed
     */
    const isModuleCompleted = (moduleId) => {
        return getModuleProgress(moduleId) === 100;
    };

    /**
     * Check if lesson is completed
     */
    const isLessonCompleted = (moduleId, lessonId) => {
        const progress = tutorialState.progress?.modules || {};
        const moduleProgress = progress[moduleId];
        
        if (!moduleProgress || !moduleProgress.lessons) return false;
        
        return moduleProgress.lessons[lessonId]?.completed || false;
    };

    /**
     * Check if lesson is current
     */
    const isCurrentLesson = (moduleId, lessonId) => {
        return tutorialState.currentModule === moduleId && 
               tutorialState.currentLesson?.id === lessonId;
    };

    /**
     * Check if lesson is unlocked
     */
    const isLessonUnlocked = (moduleId, lessonId) => {
        // For now, assume all lessons are unlocked in tutorial
        // This would be enhanced with actual unlock logic
        return true;
    };

    /**
     * Toggle module expansion
     */
    const toggleModule = (moduleId) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    /**
     * Handle lesson navigation
     */
    const handleLessonClick = async (moduleId, lessonId) => {
        if (!isLessonUnlocked(moduleId, lessonId)) {
            return;
        }
        
        setAnimationState('navigating');
        
        try {
            await onNavigate('loadLesson', { moduleId, lessonId });
        } catch (error) {
            console.error('Navigation error:', error);
        } finally {
            setAnimationState('idle');
        }
    };

    /**
     * Get achievement badges for progress
     */
    const getAchievementBadges = () => {
        const achievements = tutorialState.progress?.achievements || [];
        
        return achievements.slice(0, 3).map(achievement => ({
            icon: '🏆',
            title: achievement.title,
            description: achievement.description
        }));
    };

    /**
     * Render progress bar
     */
    const renderProgressBar = (percentage, color = theme.colors.info) => (
        <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginTop: '4px'
        }}>
            <div style={{
                width: `${percentage}%`,
                height: '100%',
                backgroundColor: color,
                transition: 'width 0.5s ease-out',
                borderRadius: '3px'
            }} />
        </div>
    );

    /**
     * Render module item
     */
    const renderModule = (moduleId, moduleData) => {
        const isExpanded = expandedModules.has(moduleId);
        const progress = getModuleProgress(moduleId);
        const isCompleted = isModuleCompleted(moduleId);
        const isCurrent = tutorialState.currentModule === moduleId;
        
        return (
            <div
                key={moduleId}
                style={{
                    marginBottom: theme.spacing.small,
                    border: `1px solid ${
                        isCurrent ? theme.colors.info : 'rgba(0, 0, 0, 0.1)'
                    }`,
                    borderRadius: theme.borderRadius,
                    backgroundColor: isCurrent ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                    overflow: 'hidden'
                }}
            >
                {/* Module Header */}
                <button
                    onClick={() => toggleModule(moduleId)}
                    style={{
                        width: '100%',
                        padding: theme.spacing.medium,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                    }}
                    aria-expanded={isExpanded}
                    aria-controls={`module-${moduleId}`}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontWeight: '600',
                            color: theme.colors.text,
                            fontSize: '14px',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.small
                        }}>
                            {isCompleted ? '✅' : isCurrent ? '🎯' : '📚'}
                            <span style={{
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                            }}>
                                {moduleData.title || moduleId}
                            </span>
                        </div>
                        
                        <div style={{
                            fontSize: '12px',
                            color: theme.colors.secondary,
                            marginBottom: '4px'
                        }}>
                            {progress}% complete
                        </div>
                        
                        {renderProgressBar(
                            progress, 
                            isCompleted ? theme.colors.success : theme.colors.info
                        )}
                    </div>
                    
                    <span style={{
                        marginLeft: theme.spacing.small,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: '12px'
                    }}>
                        ▼
                    </span>
                </button>

                {/* Module Lessons */}
                {isExpanded && (
                    <div
                        id={`module-${moduleId}`}
                        style={{
                            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                            animation: 'lessonSlideDown 0.3s ease-out'
                        }}
                    >
                        {moduleData.lessons?.map((lesson, index) => 
                            renderLesson(moduleId, lesson, index)
                        )}
                    </div>
                )}
            </div>
        );
    };

    /**
     * Render lesson item
     */
    const renderLesson = (moduleId, lesson, index) => {
        const isCompleted = isLessonCompleted(moduleId, lesson.id);
        const isCurrent = isCurrentLesson(moduleId, lesson.id);
        const isUnlocked = isLessonUnlocked(moduleId, lesson.id);
        
        return (
            <button
                key={lesson.id}
                data-lesson-id={lesson.id}
                onClick={() => handleLessonClick(moduleId, lesson.id)}
                disabled={!isUnlocked || animationState === 'navigating'}
                style={{
                    width: '100%',
                    padding: `${theme.spacing.small} ${theme.spacing.medium}`,
                    background: isCurrent ? 'rgba(52, 152, 219, 0.2)' : 'transparent',
                    border: 'none',
                    borderLeft: `3px solid ${
                        isCurrent ? theme.colors.info :
                        isCompleted ? theme.colors.success :
                        isUnlocked ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                    }`,
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    opacity: isUnlocked ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.small
                }}
                onMouseEnter={(e) => {
                    if (isUnlocked) {
                        e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = isCurrent ? 'rgba(52, 152, 219, 0.2)' : 'transparent';
                }}
                title={isUnlocked ? lesson.description : 'Complete previous lessons to unlock'}
                aria-label={`${lesson.title} - ${isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Available'}`}
            >
                <span style={{ fontSize: '14px', flexShrink: 0 }}>
                    {isCompleted ? '✅' : isCurrent ? '🎯' : isUnlocked ? '⭕' : '🔒'}
                </span>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontWeight: isCurrent ? '600' : '500',
                        color: theme.colors.text,
                        fontSize: '13px',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        marginBottom: '2px'
                    }}>
                        {lesson.title}
                    </div>
                    
                    <div style={{
                        fontSize: '11px',
                        color: theme.colors.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>{lesson.estimatedTime}</span>
                        <span>•</span>
                        <span style={{
                            color: lesson.difficulty === 'beginner' ? theme.colors.success :
                                  lesson.difficulty === 'intermediate' ? theme.colors.warning :
                                  theme.colors.error
                        }}>
                            {lesson.difficulty}
                        </span>
                    </div>
                </div>
            </button>
        );
    };

    /**
     * Render overall progress section
     */
    const renderOverallProgress = () => {
        const progress = getOverallProgress();
        const achievements = getAchievementBadges();
        
        return (
            <div style={{
                padding: theme.spacing.medium,
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderRadius: theme.borderRadius,
                marginBottom: theme.spacing.medium,
                border: `1px solid ${theme.colors.info}`
            }}>
                <div style={{
                    fontWeight: '600',
                    color: theme.colors.info,
                    fontSize: '14px',
                    marginBottom: theme.spacing.small,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.small
                }}>
                    📊 Overall Progress
                </div>
                
                <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    marginBottom: '4px'
                }}>
                    {progress}%
                </div>
                
                {renderProgressBar(progress, theme.colors.info)}
                
                {achievements.length > 0 && (
                    <div style={{
                        marginTop: theme.spacing.small,
                        paddingTop: theme.spacing.small,
                        borderTop: '1px solid rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            fontSize: '12px',
                            color: theme.colors.secondary,
                            marginBottom: '4px'
                        }}>
                            Recent Achievements:
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            gap: '4px',
                            flexWrap: 'wrap'
                        }}>
                            {achievements.map((achievement, index) => (
                                <span
                                    key={index}
                                    title={achievement.description}
                                    style={{
                                        fontSize: '16px',
                                        cursor: 'help'
                                    }}
                                >
                                    {achievement.icon}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    /**
     * Get modules from tutorial state
     */
    const getModules = () => {
        // This would typically come from the tutorial engine
        // For now, we'll create a basic structure
        const modules = {};
        
        if (tutorialState.progress?.modules) {
            Object.keys(tutorialState.progress.modules).forEach(moduleId => {
                modules[moduleId] = {
                    title: moduleId.charAt(0).toUpperCase() + moduleId.slice(1),
                    lessons: [] // This would be populated from lesson manager
                };
            });
        }
        
        // Add current module if not in progress
        if (tutorialState.currentModule && !modules[tutorialState.currentModule]) {
            modules[tutorialState.currentModule] = {
                title: tutorialState.currentModule.charAt(0).toUpperCase() + tutorialState.currentModule.slice(1),
                lessons: tutorialState.currentLesson ? [tutorialState.currentLesson] : []
            };
        }
        
        return modules;
    };

    // Don't render if no tutorial state
    if (!tutorialState || !tutorialState.isActive) {
        return null;
    }

    const sidebarWidth = isCollapsed ? '60px' : '320px';

    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes lessonSlideDown {
                    from {
                        max-height: 0;
                        opacity: 0;
                    }
                    to {
                        max-height: 500px;
                        opacity: 1;
                    }
                }
                
                @keyframes sidebarSlideIn {
                    from {
                        transform: translateX(${position === 'right' ? '100%' : '-100%'});
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                
                .progress-sidebar {
                    position: fixed;
                    top: 0;
                    ${position}: 0;
                    width: ${sidebarWidth};
                    height: 100vh;
                    background: ${theme.colors.background};
                    border-${position === 'right' ? 'left' : 'right'}: 2px solid ${theme.colors.info};
                    z-index: 9998;
                    display: flex;
                    flex-direction: column;
                    transition: width 0.3s ease-out;
                    animation: sidebarSlideIn 0.4s ease-out;
                    box-shadow: ${position === 'right' ? '-4px' : '4px'} 0 20px rgba(0, 0, 0, 0.1);
                }
                
                .sidebar-header {
                    background: ${theme.colors.info};
                    color: white;
                    padding: ${theme.spacing.medium};
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 60px;
                    flex-shrink: 0;
                }
                
                .sidebar-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: ${theme.spacing.medium};
                }
                
                .sidebar-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .sidebar-content::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                
                .sidebar-content::-webkit-scrollbar-thumb {
                    background: ${theme.colors.secondary};
                    border-radius: 3px;
                }
                
                @media (max-width: 768px) {
                    .progress-sidebar {
                        width: ${isCollapsed ? '50px' : '280px'};
                    }
                }
                
                @media (max-width: 480px) {
                    .progress-sidebar {
                        width: ${isCollapsed ? '40px' : '100vw'};
                        ${position}: ${isCollapsed ? '0' : '0'};
                    }
                }
            `}</style>

            {/* Sidebar Container */}
            <div
                ref={sidebarRef}
                className="progress-sidebar"
                role="complementary"
                aria-label="Tutorial progress and navigation"
            >
                {/* Sidebar Header */}
                <div className="sidebar-header">
                    {!isCollapsed && (
                        <>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}>
                                    📈 Tutorial Progress
                                </h3>
                            </div>
                            
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                    transition: 'background-color 0.2s ease',
                                    marginRight: theme.spacing.small
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                }}
                                title="Toggle details"
                                aria-label="Toggle progress details"
                            >
                                {showDetails ? '📊' : '📋'}
                            </button>
                        </>
                    )}
                    
                    <button
                        onClick={onToggle}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                        }}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? '📈' : position === 'right' ? '→' : '←'}
                    </button>
                </div>

                {/* Sidebar Content */}
                {!isCollapsed && (
                    <div ref={scrollRef} className="sidebar-content">
                        {/* Overall Progress */}
                        {showDetails && renderOverallProgress()}
                        
                        {/* Modules List */}
                        <div>
                            {Object.entries(getModules()).map(([moduleId, moduleData]) =>
                                renderModule(moduleId, moduleData)
                            )}
                        </div>
                        
                        {/* Navigation Help */}
                        <div style={{
                            marginTop: theme.spacing.large,
                            padding: theme.spacing.medium,
                            backgroundColor: 'rgba(0, 0, 0, 0.05)',
                            borderRadius: theme.borderRadius,
                            fontSize: '12px',
                            color: theme.colors.secondary
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                💡 Quick Tips
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                <li>Click lessons to navigate</li>
                                <li>Expand modules to see all lessons</li>
                                <li>Track your overall progress above</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ProgressSidebar;