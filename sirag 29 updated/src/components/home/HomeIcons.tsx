import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export interface HomeIconProps {
  name:
    | 'clock'
    | 'compass'
    | 'moon'
    | 'calendar'
    | 'book-open'
    | 'target'
    | 'trophy'
    | 'shopping-bag'
    | 'home'
    | 'users'
    | 'user'
    | 'flame'
    | 'bolt'
    | 'check'
    | 'bell';
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function HomeIcon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8 }: HomeIconProps) {
  switch (name) {
    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 7v5l3 2" />
        </Svg>
      );
    case 'compass':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Path d="M15.5 8.5l-2 5-5 2 2-5z" />
        </Svg>
      );
    case 'moon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="4" y="5" width="16" height="15" rx="2" />
          <Path d="M4 10h16M9 3v4M15 3v4" />
        </Svg>
      );
    case 'book-open':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z" />
        </Svg>
      );
    case 'target':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="9" />
          <Circle cx="12" cy="12" r="4" />
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 3 3M16 6h4v1a3 3 0 0 1-3 3M12 13v4M8 20h8" />
        </Svg>
      );
    case 'shopping-bag':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0" />
        </Svg>
      );
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 11l8-7 8 7v9H4z" />
        </Svg>
      );
    case 'users':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="9" cy="9" r="3" />
          <Path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 20a5 5 0 0 0-3-4.5" />
        </Svg>
      );
    case 'user':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="8" r="4" />
          <Path d="M4 21a8 8 0 0 1 16 0" />
        </Svg>
      );
    case 'flame':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-9z" />
        </Svg>
      );
    case 'bolt':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M13 3L5 14h6l-1 7 8-11h-6z" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 12l5 5 9-10" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </Svg>
      );
    default:
      return null;
  }
}
