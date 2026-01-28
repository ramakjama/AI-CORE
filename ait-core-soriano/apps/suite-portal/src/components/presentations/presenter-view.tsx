"use client";

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Slide {
  id: string;
  content: string;
  notes?: string;
  transition?: string;
}

interface PresenterViewProps {
  slides: Slide[];
  currentSlideIndex: number;
  onClose: () => void;
  onSlideChange: (index: number) => void;
  theme?: string;
  transition?: string;
}

export function PresenterView({
  slides,
  currentSlideIndex,
  onClose,
  onSlideChange,
  theme = 'black',
  transition = 'slide',
}: PresenterViewProps) {
  const [timer, setTimer] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(true);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      onSlideChange(currentSlideIndex - 1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      onSlideChange(currentSlideIndex + 1);
    }
  };

  const currentSlide = slides[currentSlideIndex];
  const nextSlide = slides[currentSlideIndex + 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Presenter View</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-2xl font-mono font-semibold">
              {formatTime(timer)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="ml-2"
            >
              {isTimerRunning ? 'Pause' : 'Resume'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTimer(0)}
            >
              Reset
            </Button>
          </div>

          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Current Slide - Large */}
        <div className="flex-1 flex flex-col p-6">
          <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
            <div
              className="w-full h-full flex items-center justify-center p-8"
              dangerouslySetInnerHTML={{ __html: currentSlide.content }}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePrevSlide}
              disabled={currentSlideIndex === 0}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleNextSlide}
              disabled={currentSlideIndex === slides.length - 1}
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* Next Slide Preview */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Next Slide
            </h3>
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              {nextSlide ? (
                <div
                  className="w-full h-full flex items-center justify-center p-4 text-xs"
                  dangerouslySetInnerHTML={{ __html: nextSlide.content }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  End of presentation
                </div>
              )}
            </div>
          </div>

          {/* Speaker Notes */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              Speaker Notes
            </h3>
            <div className="bg-gray-800 rounded-lg p-4 h-full overflow-y-auto">
              {currentSlide.notes ? (
                <p className="text-gray-300 whitespace-pre-wrap">
                  {currentSlide.notes}
                </p>
              ) : (
                <p className="text-gray-500 italic">No notes for this slide</p>
              )}
            </div>
          </div>

          {/* Slide Thumbnails */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              All Slides
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => onSlideChange(index)}
                  className={cn(
                    'aspect-video bg-gray-800 rounded border-2 transition-all relative overflow-hidden',
                    index === currentSlideIndex
                      ? 'border-primary ring-2 ring-primary/50'
                      : 'border-gray-700 hover:border-gray-600'
                  )}
                >
                  <div
                    className="w-full h-full flex items-center justify-center p-2 text-[0.5rem]"
                    dangerouslySetInnerHTML={{ __html: slide.content }}
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                    {index + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
