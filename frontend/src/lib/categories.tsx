import type { ReactElement } from 'react';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaletteIcon from '@mui/icons-material/Palette';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import MemoryIcon from '@mui/icons-material/Memory';
import NightlifeIcon from '@mui/icons-material/Nightlife';
import GroupsIcon from '@mui/icons-material/Groups';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import MovieIcon from '@mui/icons-material/Movie';
import CategoryIcon from '@mui/icons-material/Category';
import { CATEGORIES, type EventCategory } from '../api/types';

interface CategoryMeta {
  label: string;
  icon: ReactElement;
  /** Two-stop gradient used for cards without an image. */
  gradient: [string, string];
}

const META: CategoryMeta[] = [
  { label: 'Music', icon: <MusicNoteIcon />, gradient: ['#7c4dff', '#e040fb'] },
  { label: 'Food', icon: <RestaurantIcon />, gradient: ['#ff6d00', '#ffab40'] },
  { label: 'Arts', icon: <PaletteIcon />, gradient: ['#d81b60', '#ff8a80'] },
  { label: 'Sports', icon: <SportsSoccerIcon />, gradient: ['#00897b', '#64ffda'] },
  { label: 'Tech', icon: <MemoryIcon />, gradient: ['#1e88e5', '#00e5ff'] },
  { label: 'Nightlife', icon: <NightlifeIcon />, gradient: ['#311b92', '#c51162'] },
  { label: 'Community', icon: <GroupsIcon />, gradient: ['#43a047', '#c6ff00'] },
  { label: 'Theatre', icon: <TheaterComedyIcon />, gradient: ['#b71c1c', '#ffb300'] },
  { label: 'Film', icon: <MovieIcon />, gradient: ['#263238', '#78909c'] },
  { label: 'Other', icon: <CategoryIcon />, gradient: ['#5c6bc0', '#90a4ae'] },
];

export function categoryMeta(category: EventCategory): CategoryMeta {
  return META[category] ?? META[CATEGORIES.length - 1];
}

export const CATEGORY_OPTIONS = CATEGORIES.map((_, value) => ({ value, ...META[value] }));
