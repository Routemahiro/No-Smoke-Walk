'use client';

import { useState, useEffect } from 'react';
import { FingerprintGenerator } from '@/lib/fingerprint';

interface RateLimitState {
  isBlocked: boolean;
  remainingTime: number;
  submissionCount: number;
  maxSubmissions: number;
  windowMinutes: number;
}

interface SubmissionRecord {
  timestamp: number;
  fingerprint: string;
}

const STORAGE_KEY = 'no-smoke-walk-submissions';
const MAX_SUBMISSIONS = 5;
const WINDOW_MINUTES = 10;

export function useRateLimit() {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isBlocked: false,
    remainingTime: 0,
    submissionCount: 0,
    maxSubmissions: MAX_SUBMISSIONS,
    windowMinutes: WINDOW_MINUTES,
  });

  const [fingerprint, setFingerprint] = useState<string>('');

  // Initialize fingerprint on mount
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        // Use minimal fingerprint for privacy
        const fp = await FingerprintGenerator.getMinimalFingerprint();
        setFingerprint(fp);
      } catch (error) {
        console.error('Failed to generate fingerprint:', error);
        // Use fallback identifier
        setFingerprint(`fallback-${Date.now()}-${Math.random()}`);
      }
    };

    initFingerprint();
  }, []);

  // Check rate limit status
  const checkRateLimit = (): RateLimitState => {
    const now = Date.now();
    const windowMs = WINDOW_MINUTES * 60 * 1000;
    const submissions = getStoredSubmissions();

    // Filter submissions within current window
    const recentSubmissions = submissions.filter(
      sub => now - sub.timestamp < windowMs && sub.fingerprint === fingerprint
    );

    // Clean old submissions from storage
    const validSubmissions = submissions.filter(
      sub => now - sub.timestamp < windowMs
    );
    storeSubmissions(validSubmissions);

    const isBlocked = recentSubmissions.length >= MAX_SUBMISSIONS;
    let remainingTime = 0;

    if (isBlocked && recentSubmissions.length > 0) {
      const oldestSubmission = Math.min(...recentSubmissions.map(s => s.timestamp));
      remainingTime = Math.ceil((oldestSubmission + windowMs - now) / 1000);
    }

    return {
      isBlocked,
      remainingTime: Math.max(0, remainingTime),
      submissionCount: recentSubmissions.length,
      maxSubmissions: MAX_SUBMISSIONS,
      windowMinutes: WINDOW_MINUTES,
    };
  };

  // Record a new submission
  const recordSubmission = (): boolean => {
    const currentState = checkRateLimit();
    
    if (currentState.isBlocked) {
      setRateLimitState(currentState);
      return false;
    }

    // Record the submission
    const submissions = getStoredSubmissions();
    submissions.push({
      timestamp: Date.now(),
      fingerprint: fingerprint
    });
    storeSubmissions(submissions);

    // Update state
    const newState = checkRateLimit();
    setRateLimitState(newState);
    
    return true;
  };

  // Reset rate limit (for testing)
  const resetRateLimit = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRateLimitState({
      isBlocked: false,
      remainingTime: 0,
      submissionCount: 0,
      maxSubmissions: MAX_SUBMISSIONS,
      windowMinutes: WINDOW_MINUTES,
    });
  };

  // Get stored submissions from localStorage
  const getStoredSubmissions = (): SubmissionRecord[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse stored submissions:', error);
      return [];
    }
  };

  // Store submissions to localStorage
  const storeSubmissions = (submissions: SubmissionRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    } catch (error) {
      console.error('Failed to store submissions:', error);
    }
  };

  // Update rate limit state periodically
  useEffect(() => {
    if (!fingerprint) return;

    const updateState = () => {
      const newState = checkRateLimit();
      setRateLimitState(newState);
    };

    // Initial check
    updateState();

    // Update every second when blocked
    const interval = setInterval(() => {
      const newState = checkRateLimit();
      setRateLimitState(newState);
      
      // Stop interval when no longer blocked
      if (!newState.isBlocked && newState.remainingTime === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fingerprint]);

  return {
    ...rateLimitState,
    fingerprint,
    recordSubmission,
    resetRateLimit,
    checkRateLimit,
  };
}