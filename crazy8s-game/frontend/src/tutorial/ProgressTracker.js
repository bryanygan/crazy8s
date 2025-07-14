/**
 * ProgressTracker.js - Tracks and persists user progress through tutorial
 * Handles progress persistence, completion tracking, and statistics
 */

import { FaCheck, FaSync, FaTrophy, FaBullseye, FaTrash, FaCog, FaDownload, FaUpload, FaChartBar, FaFolder, FaFile, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Tracks and persists user tutorial progress
 */
class ProgressTracker {
    /**
     * Initialize the progress tracker
     */
    constructor() {
        this.storageKey = 'crazy8s_tutorial_progress';
        this.progress = {
            version: '1.0.0',
            startedAt: null,
            lastUpdated: null,
            totalTimeSpent: 0,
            modules: new Map(),
            achievements: [],
            settings: {
                hintsEnabled: true,
                skipCompleted: false,
                autoAdvance: true
            }
        };
        
        this.sessionStartTime = Date.now();
        this.isModified = false;
        
        this.initialize();
    }

    /**
     * Initialize the progress tracker
     * @private
     */
    initialize() {
        this.loadProgress();
        this.setupAutoSave();
        console.log('Progress Tracker initialized');
    }

    /**
     * Set up automatic progress saving
     * @private
     */
    setupAutoSave() {
        // Auto-save every 30 seconds if there are changes
        setInterval(() => {
            if (this.isModified) {
                this.saveProgress();
            }
        }, 30000);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveProgress();
        });
    }

    /**
     * Load progress from localStorage
     * @returns {boolean} Whether progress was loaded successfully
     */
    loadProgress() {
        try {
            const savedProgress = localStorage.getItem(this.storageKey);
            
            if (savedProgress) {
                const parsed = JSON.parse(savedProgress);
                
                // Validate version compatibility
                if (this.isVersionCompatible(parsed.version)) {
                    // Convert modules Map from storage
                    if (parsed.modules) {
                        this.progress.modules = new Map(Object.entries(parsed.modules));
                        
                        // Convert lesson Maps within modules
                        for (const [moduleId, moduleData] of this.progress.modules.entries()) {
                            if (moduleData.lessons) {
                                moduleData.lessons = new Map(Object.entries(moduleData.lessons));
                            }
                        }
                    }
                    
                    // Merge with default structure
                    this.progress = {
                        ...this.progress,
                        ...parsed,
                        modules: this.progress.modules
                    };
                    
                    console.log('Progress loaded from localStorage');
                    return true;
                } else {
                    console.warn('Progress version incompatible, starting fresh');
                    this.resetProgress();
                    return false;
                }
            } else {
                console.log('No previous progress found, starting fresh');
                this.progress.startedAt = Date.now();
                return false;
            }
            
        } catch (error) {
            console.error('Failed to load progress:', error);
            this.resetProgress();
            return false;
        }
    }

    /**
     * Save progress to localStorage
     * @returns {boolean} Whether progress was saved successfully
     */
    saveProgress() {
        try {
            // Update timestamps
            this.progress.lastUpdated = Date.now();
            this.progress.totalTimeSpent += Date.now() - this.sessionStartTime;
            this.sessionStartTime = Date.now();
            
            // Prepare data for storage (convert Maps to Objects)
            const dataToSave = {
                ...this.progress,
                modules: Object.fromEntries(
                    Array.from(this.progress.modules.entries()).map(([moduleId, moduleData]) => [
                        moduleId,
                        {
                            ...moduleData,
                            lessons: Object.fromEntries(moduleData.lessons || new Map())
                        }
                    ])
                )
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            this.isModified = false;
            
            console.log('Progress saved to localStorage');
            return true;
            
        } catch (error) {
            console.error('Failed to save progress:', error);
            return false;
        }
    }

    /**
     * Check if version is compatible
     * @param {string} version - Version string to check
     * @returns {boolean} Whether version is compatible
     * @private
     */
    isVersionCompatible(version) {
        if (!version) return false;
        
        const [major] = version.split('.');
        const [currentMajor] = this.progress.version.split('.');
        
        return major === currentMajor;
    }

    /**
     * Reset all progress
     * @returns {boolean} Whether reset was successful
     */
    resetProgress() {
        console.log('Resetting all progress');
        
        this.progress = {
            version: '1.0.0',
            startedAt: Date.now(),
            lastUpdated: Date.now(),
            totalTimeSpent: 0,
            modules: new Map(),
            achievements: [],
            settings: {
                hintsEnabled: true,
                skipCompleted: false,
                autoAdvance: true
            }
        };
        
        this.isModified = true;
        return this.saveProgress();
    }

    /**
     * Mark a lesson as started
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier
     */
    markLessonStarted(moduleId, lessonId) {
        console.log(`Lesson started: ${moduleId}/${lessonId}`);
        
        const moduleData = this.ensureModuleExists(moduleId);
        const lessonData = this.ensureLessonExists(moduleData, lessonId);
        
        if (!lessonData.startedAt) {
            lessonData.startedAt = Date.now();
            lessonData.attempts = (lessonData.attempts || 0) + 1;
            this.isModified = true;
        }
        
        lessonData.lastAttemptAt = Date.now();
        this.isModified = true;
    }

    /**
     * Mark a lesson as completed
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier
     * @param {Object} completionData - Additional completion data
     */
    markLessonCompleted(moduleId, lessonId, completionData = {}) {
        console.log(`Lesson completed: ${moduleId}/${lessonId}`);
        
        const moduleData = this.ensureModuleExists(moduleId);
        const lessonData = this.ensureLessonExists(moduleData, lessonId);
        
        lessonData.completed = true;
        lessonData.completedAt = Date.now();
        
        if (lessonData.startedAt) {
            lessonData.completionTime = lessonData.completedAt - lessonData.startedAt;
        }
        
        // Add completion data
        Object.assign(lessonData, completionData);
        
        // Update module progress
        this.updateModuleProgress(moduleId);
        
        // Check for achievements
        this.checkAchievements(moduleId, lessonId);
        
        this.isModified = true;
    }

    /**
     * Update lesson progress with partial data
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier
     * @param {Object} progressData - Progress data to update
     */
    updateLessonProgress(moduleId, lessonId, progressData) {
        const moduleData = this.ensureModuleExists(moduleId);
        const lessonData = this.ensureLessonExists(moduleData, lessonId);
        
        // Update progress data
        if (progressData.hintsUsed !== undefined) {
            lessonData.hintsUsed = (lessonData.hintsUsed || 0) + progressData.hintsUsed;
        }
        
        if (progressData.errorsCount !== undefined) {
            lessonData.errorsCount = (lessonData.errorsCount || 0) + progressData.errorsCount;
        }
        
        if (progressData.timeSpent !== undefined) {
            lessonData.timeSpent = (lessonData.timeSpent || 0) + progressData.timeSpent;
        }
        
        if (progressData.objectivesCompleted !== undefined) {
            lessonData.objectivesCompleted = progressData.objectivesCompleted;
        }
        
        lessonData.lastUpdated = Date.now();
        this.isModified = true;
        
        console.log(`Updated progress for ${moduleId}/${lessonId}:`, progressData);
    }

    /**
     * Check if a lesson is completed
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier
     * @returns {boolean} Whether lesson is completed
     */
    isLessonCompleted(moduleId, lessonId) {
        const moduleData = this.progress.modules.get(moduleId);
        if (!moduleData) return false;
        
        const lessonData = moduleData.lessons.get(lessonId);
        return lessonData ? lessonData.completed === true : false;
    }

    /**
     * Check if a module is completed
     * @param {string} moduleId - Module identifier
     * @returns {boolean} Whether module is completed
     */
    isModuleCompleted(moduleId) {
        const moduleData = this.progress.modules.get(moduleId);
        if (!moduleData) return false;
        
        return moduleData.completed === true;
    }

    /**
     * Check if the entire tutorial is completed
     * @returns {boolean} Whether tutorial is completed
     */
    isTutorialCompleted() {
        if (this.progress.modules.size === 0) return false;
        
        for (const moduleData of this.progress.modules.values()) {
            if (!moduleData.completed) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get lesson progress data
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier
     * @returns {Object|null} Lesson progress data
     */
    getLessonProgress(moduleId, lessonId) {
        const moduleData = this.progress.modules.get(moduleId);
        if (!moduleData) return null;
        
        const lessonData = moduleData.lessons.get(lessonId);
        return lessonData ? { ...lessonData } : null;
    }

    /**
     * Get module progress data
     * @param {string} moduleId - Module identifier
     * @returns {Object|null} Module progress data
     */
    getModuleProgress(moduleId) {
        const moduleData = this.progress.modules.get(moduleId);
        return moduleData ? { ...moduleData } : null;
    }

    /**
     * Get overall progress summary
     * @returns {Object} Progress summary
     */
    getProgress() {
        const totalModules = this.progress.modules.size;
        const completedModules = Array.from(this.progress.modules.values())
            .filter(module => module.completed).length;
        
        let totalLessons = 0;
        let completedLessons = 0;
        
        for (const moduleData of this.progress.modules.values()) {
            if (moduleData.lessons) {
                totalLessons += moduleData.lessons.size;
                completedLessons += Array.from(moduleData.lessons.values())
                    .filter(lesson => lesson.completed).length;
            }
        }
        
        return {
            modules: {
                total: totalModules,
                completed: completedModules,
                percentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
            },
            lessons: {
                total: totalLessons,
                completed: completedLessons,
                percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
            },
            timeSpent: this.progress.totalTimeSpent,
            startedAt: this.progress.startedAt,
            lastUpdated: this.progress.lastUpdated,
            achievements: this.progress.achievements.length,
            isCompleted: this.isTutorialCompleted()
        };
    }

    /**
     * Get detailed statistics
     * @returns {Object} Detailed statistics
     */
    getDetailedStatistics() {
        const moduleStats = [];
        
        for (const [moduleId, moduleData] of this.progress.modules.entries()) {
            const lessonStats = [];
            
            for (const [lessonId, lessonData] of moduleData.lessons.entries()) {
                lessonStats.push({
                    id: lessonId,
                    completed: lessonData.completed || false,
                    attempts: lessonData.attempts || 0,
                    hintsUsed: lessonData.hintsUsed || 0,
                    errorsCount: lessonData.errorsCount || 0,
                    completionTime: lessonData.completionTime || null,
                    startedAt: lessonData.startedAt || null,
                    completedAt: lessonData.completedAt || null
                });
            }
            
            moduleStats.push({
                id: moduleId,
                completed: moduleData.completed || false,
                startedAt: moduleData.startedAt || null,
                completedAt: moduleData.completedAt || null,
                lessons: lessonStats,
                totalLessons: lessonStats.length,
                completedLessons: lessonStats.filter(l => l.completed).length
            });
        }
        
        return {
            overall: this.getProgress(),
            modules: moduleStats,
            achievements: [...this.progress.achievements],
            settings: { ...this.progress.settings }
        };
    }

    /**
     * Update tutorial settings
     * @param {Object} newSettings - Settings to update
     */
    updateSettings(newSettings) {
        console.log('Updating tutorial settings:', newSettings);
        
        this.progress.settings = {
            ...this.progress.settings,
            ...newSettings
        };
        
        this.isModified = true;
    }

    /**
     * Get current settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return { ...this.progress.settings };
    }

    /**
     * Add an achievement
     * @param {Object} achievement - Achievement data
     */
    addAchievement(achievement) {
        const achievementData = {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            earnedAt: Date.now(),
            ...achievement
        };
        
        // Check if achievement already exists
        if (!this.progress.achievements.some(a => a.id === achievement.id)) {
            this.progress.achievements.push(achievementData);
            this.isModified = true;
            
            console.log('Achievement earned:', achievement.title);
        }
    }

    /**
     * Get all achievements
     * @returns {Array<Object>} All achievements
     */
    getAchievements() {
        return [...this.progress.achievements];
    }

    /**
     * Export progress data for backup
     * @returns {string} JSON string of progress data
     */
    exportProgress() {
        const exportData = {
            ...this.progress,
            exportedAt: Date.now(),
            modules: Object.fromEntries(
                Array.from(this.progress.modules.entries()).map(([moduleId, moduleData]) => [
                    moduleId,
                    {
                        ...moduleData,
                        lessons: Object.fromEntries(moduleData.lessons || new Map())
                    }
                ])
            )
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import progress data from backup
     * @param {string} progressJson - JSON string of progress data
     * @returns {boolean} Whether import was successful
     */
    importProgress(progressJson) {
        try {
            const importedData = JSON.parse(progressJson);
            
            if (!this.isVersionCompatible(importedData.version)) {
                throw new Error('Incompatible version');
            }
            
            // Convert modules back to Maps
            if (importedData.modules) {
                this.progress.modules = new Map(Object.entries(importedData.modules));
                
                for (const [moduleId, moduleData] of this.progress.modules.entries()) {
                    if (moduleData.lessons) {
                        moduleData.lessons = new Map(Object.entries(moduleData.lessons));
                    }
                }
            }
            
            // Merge imported data
            this.progress = {
                ...this.progress,
                ...importedData,
                modules: this.progress.modules,
                importedAt: Date.now()
            };
            
            this.isModified = true;
            this.saveProgress();
            
            console.log('Progress imported successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to import progress:', error);
            return false;
        }
    }

    /**
     * Ensure module exists in progress
     * @param {string} moduleId - Module identifier
     * @returns {Object} Module data
     * @private
     */
    ensureModuleExists(moduleId) {
        if (!this.progress.modules.has(moduleId)) {
            this.progress.modules.set(moduleId, {
                id: moduleId,
                startedAt: null,
                completedAt: null,
                completed: false,
                lessons: new Map()
            });
        }
        
        return this.progress.modules.get(moduleId);
    }

    /**
     * Ensure lesson exists in module
     * @param {Object} moduleData - Module data
     * @param {string} lessonId - Lesson identifier
     * @returns {Object} Lesson data
     * @private
     */
    ensureLessonExists(moduleData, lessonId) {
        if (!moduleData.lessons.has(lessonId)) {
            moduleData.lessons.set(lessonId, {
                id: lessonId,
                startedAt: null,
                completedAt: null,
                completed: false,
                attempts: 0,
                hintsUsed: 0,
                errorsCount: 0,
                timeSpent: 0
            });
        }
        
        return moduleData.lessons.get(lessonId);
    }

    /**
     * Update module progress
     * @param {string} moduleId - Module identifier
     * @private
     */
    updateModuleProgress(moduleId) {
        const moduleData = this.progress.modules.get(moduleId);
        if (!moduleData) return;
        
        // Check if all lessons in module are completed
        const allLessonsCompleted = Array.from(moduleData.lessons.values())
            .every(lesson => lesson.completed);
        
        if (allLessonsCompleted && moduleData.lessons.size > 0) {
            moduleData.completed = true;
            
            if (!moduleData.completedAt) {
                moduleData.completedAt = Date.now();
                console.log(`Module completed: ${moduleId}`);
            }
        }
    }

    /**
     * Check for achievements
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier
     * @private
     */
    checkAchievements(moduleId, lessonId) {
        const lessonData = this.getLessonProgress(moduleId, lessonId);
        if (!lessonData) return;
        
        // First lesson completed
        if (moduleId === 'basics' && lessonId === 'basic_play') {
            this.addAchievement({
                id: 'first_lesson',
                title: 'Getting Started',
                description: 'Completed your first tutorial lesson'
            });
        }
        
        // Perfect lesson (no hints, no errors)
        if (lessonData.hintsUsed === 0 && lessonData.errorsCount === 0) {
            this.addAchievement({
                id: 'perfect_lesson',
                title: 'Perfect Execution',
                description: 'Completed a lesson without hints or errors'
            });
        }
        
        // Fast completion (under 2 minutes)
        if (lessonData.completionTime && lessonData.completionTime < 120000) {
            this.addAchievement({
                id: 'speed_learner',
                title: 'Speed Learner',
                description: 'Completed a lesson in under 2 minutes'
            });
        }
        
        // Module completion
        if (this.isModuleCompleted(moduleId)) {
            this.addAchievement({
                id: `module_${moduleId}`,
                title: `${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)} Master`,
                description: `Completed the ${moduleId} module`
            });
        }
        
        // Tutorial completion
        if (this.isTutorialCompleted()) {
            this.addAchievement({
                id: 'tutorial_complete',
                title: 'Tutorial Master',
                description: 'Completed the entire tutorial'
            });
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        console.log('Destroying progress tracker');
        
        // Save final progress
        this.saveProgress();
        
        // Clear intervals and listeners
        // (Note: In a real implementation, you'd store interval IDs to clear them)
    }
}

export default ProgressTracker;