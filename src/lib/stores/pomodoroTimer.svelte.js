import { supabase } from '$lib/supabase';
import { user } from '$lib/stores/auth';
import { addToQueue } from '$lib/utils/queue';
import { get } from 'svelte/store';

// Global interval variable (outside class to persist)
let interval = null;

class PomodoroTimer {
    // --- State (Runes) ---
    isRunning = $state(false);
    isBreak = $state(false);
    currentCycle = $state(1);
    timeLeft = $state(25 * 60);
    totalTime = $state(25 * 60);
    interruptions = $state(0);
    startTime = $state(null);
    
    // Configuration
    config = $state({
        workDuration: 25,
        breakDuration: 5,
        cycles: 4
    });

    session = $state({
        title: '',
        selectedCourseId: ''
    });

    // Feedback
    successMessage = $state(null);
    error = $state(null);

    // --- Computed ---
    get progress() {
        return ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
    }

    get strokeDashoffset() {
        return 283 - (283 * this.progress) / 100;
    }

    constructor() {
        // Optional: Load from localStorage if you want persistence across browser refreshes
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateDuration() {
        if (!this.isRunning) {
            this.totalTime = (this.isBreak ? this.config.breakDuration : this.config.workDuration) * 60;
            this.timeLeft = this.totalTime;
        }
    }

    start() {
        if (!this.session.title && !this.session.selectedCourseId) {
            this.error = "Please enter a goal or select a course.";
            return;
        }

        this.error = null;
        this.isRunning = true;
        if (!this.startTime) this.startTime = new Date().toISOString();

        if (interval) clearInterval(interval);

        interval = setInterval(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
            } else {
                this.handleCycleComplete();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        this.interruptions++;
        if (interval) clearInterval(interval);
    }

    reset() {
        this.pause();
        this.isBreak = false;
        this.currentCycle = 1;
        this.startTime = null;
        this.interruptions = 0;
        this.updateDuration();
    }

    toggle() {
        if (this.isRunning) this.pause();
        else this.start();
    }

    handleCycleComplete() {
        if (interval) clearInterval(interval);

        if (this.isBreak) {
            // Break Ended -> Back to Work
            if (this.currentCycle < this.config.cycles) {
                this.currentCycle++;
                this.isBreak = false;
                this.totalTime = this.config.workDuration * 60;
                this.timeLeft = this.totalTime;
                this.start();
            } else {
                this.completeSession();
            }
        } else {
            // Work Ended -> Start Break
            this.isBreak = true;
            this.totalTime = this.config.breakDuration * 60;
            this.timeLeft = this.totalTime;
            this.start();
        }
    }

    async completeSession() {
        this.pause();
        const currentUser = get(user);

        if (!currentUser) return;

        const sessionData = {
            user_id: currentUser.id,
            notes: this.session.title || 'Focused Session',
            course_id: this.session.selectedCourseId || null,
            work_duration: this.config.workDuration,
            break_duration: this.config.breakDuration,
            started_at: this.startTime,
            completed: true,
            ended_at: new Date().toISOString(),
            interruptions: this.interruptions
        };

        // 1. Check Offline Status
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            addToQueue({
                type: 'CREATE_POMODORO_SESSION',
                data: sessionData
            });
            this.handleSuccess("Session saved offline!");
            return;
        }

        // 2. Try Online Save
        try {
            const { error: err } = await supabase
                .from('pomodoro_sessions')
                .insert(sessionData);

            if (err) throw err;
            this.handleSuccess("🎉 Session Complete!");
        } catch (err) {
            console.error('Upload failed, queuing:', err);
            // 3. Fallback to Queue if Error
            addToQueue({
                type: 'CREATE_POMODORO_SESSION',
                data: sessionData
            });
            this.handleSuccess("Saved to queue (Network Error)");
        }
    }

    handleSuccess(msg) {
        this.successMessage = msg;
        setTimeout(() => { this.successMessage = null; }, 4000);
        this.reset();
        this.session.title = '';
    }
}

export const timer = new PomodoroTimer();