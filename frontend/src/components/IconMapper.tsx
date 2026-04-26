import { 
  Palmtree, 
  Utensils, 
  ShoppingBag, 
  PartyPopper, 
  MapPin, 
  Target, 
  Camera, 
  Footprints, 
  Bike, 
  Train,
  ArrowRightLeft,
  Route,
  Map as MapIcon,
  CheckCircle,
  AlertTriangle,
  Radio,
  Gamepad2
} from 'lucide-react';
import React from 'react';

const emojiToIcon: Record<string, React.ElementType> = {
  '🏛': Palmtree,
  '🍜': Utensils,
  '🛍': ShoppingBag,
  '🎉': PartyPopper,
  '📍': MapPin,
  '🎯': Target,
  '📸': Camera,
  '🚶': Footprints,
  '🚲': Bike,
  '🚇': Train,
  '🚉': Train,
  '🔄': ArrowRightLeft,
  '🔀': Route,
  '🗺️': MapIcon,
  '✅': CheckCircle,
  '⚠️': AlertTriangle,
  '📡': Radio,
  '🎮': Gamepad2
};

interface IconMapperProps {
  emoji: string;
  className?: string;
  size?: number;
}

export default function IconMapper({ emoji, className, size = 18 }: IconMapperProps) {
  const IconComponent = emojiToIcon[emoji];
  if (!IconComponent) return <span>{emoji}</span>;
  return <IconComponent className={className} size={size} />;
}
