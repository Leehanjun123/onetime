'use client'

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addFavoriteJob, removeFavoriteJob, FavoriteJob } from '@/store/slices/favoritesSlice';
import { trackEvent } from './Analytics';

interface FavoriteButtonProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    hourlyPay: number;
    category: string;
  };
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function FavoriteButton({ job, size = 'medium', showLabel = false }: FavoriteButtonProps) {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector((state) => state.favorites.jobs);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsFavorite(favorites.some(fav => fav.id === job.id));
  }, [favorites, job.id]);

  const handleToggleFavorite = () => {
    setIsAnimating(true);
    
    if (isFavorite) {
      dispatch(removeFavoriteJob(job.id));
      
      // 분석 이벤트 추적
      trackEvent('remove_favorite', {
        event_category: 'favorites',
        job_id: job.id,
        job_category: job.category,
        hourly_pay: job.hourlyPay
      });
    } else {
      const favoriteJob: FavoriteJob = {
        ...job,
        savedAt: new Date().toISOString()
      };
      dispatch(addFavoriteJob(favoriteJob));
      
      // 분석 이벤트 추적
      trackEvent('add_favorite', {
        event_category: 'favorites',
        job_id: job.id,
        job_category: job.category,
        hourly_pay: job.hourlyPay
      });
      
      // 햅틱 피드백 (모바일)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    small: 'w-8 h-8 text-lg',
    medium: 'w-10 h-10 text-xl',
    large: 'w-12 h-12 text-2xl'
  };

  return (
    <button
      onClick={handleToggleFavorite}
      className={`
        ${showLabel ? 'flex items-center gap-2 px-4 py-2' : sizeClasses[size]}
        ${showLabel ? 'bg-white border-2' : 'bg-white/90 backdrop-blur-sm'}
        ${isFavorite ? 'border-red-500' : 'border-gray-300'}
        rounded-full shadow-lg hover:scale-110 transition-all duration-200
        flex items-center justify-center
        ${isAnimating ? 'animate-bounce' : ''}
      `}
      aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      <span 
        className={`
          ${isFavorite ? 'text-red-500' : 'text-gray-400'}
          ${isAnimating ? 'animate-ping' : ''}
        `}
      >
        {isFavorite ? '❤️' : '🤍'}
      </span>
      {showLabel && (
        <span className={`text-sm font-medium ${isFavorite ? 'text-red-500' : 'text-gray-600'}`}>
          {isFavorite ? '저장됨' : '저장'}
        </span>
      )}
    </button>
  );
}