import type { SVGProps } from 'react';
import { iconUrl } from '../assets';

/**
 * Icon set.
 *
 * - placeholder mode: self-authored inline SVG (no original artwork shipped).
 * - original mode: the real drawable when the icon map has a mapping, falling
 *   back to the inline SVG for icons without a verified original.
 *
 * The public API (`name`, `size`, `filled`) is unchanged for existing callers.
 */
export const ICON_PATHS = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  timer: 'M12 8v5l3 2|M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18|M9 3h6',
  focus: 'M12 4a6 6 0 0 1 6 6c0 3-2 4-2 7H8c0-3-2-4-2-7a6 6 0 0 1 6-6z|M10 20h4',
  leaf: 'M5 19c8 1 14-4 14-13-9 0-14 5-14 13z|M5 19c2-4 5-7 9-9',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z|M12 8v8|M9.5 10a2.5 2.5 0 0 1 5 0c0 2-5 2-5 4a2.5 2.5 0 0 0 5 0',
  plus: 'M12 5v14M5 12h14',
  gem: 'M6 4h12l3 6-9 10L3 10z|M3 10h18|M9 4l3 6 3-6|M12 10v10',
  headphone: 'M4 14v-2a8 8 0 0 1 16 0v2|M4 14h3v6H5a1 1 0 0 1-1-1z|M20 14h-3v6h2a1 1 0 0 0 1-1z',
  headphoneMute: 'M4 14v-2a8 8 0 0 1 13-6|M4 14h3v6H5a1 1 0 0 1-1-1z|M20 14h-3v6h2a1 1 0 0 0 1-1z|M3 3l18 18',
  back: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  chevronDown: 'M5 9l7 7 7-7',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 13l4 4L19 7',
  edit: 'M4 20h4L20 8l-4-4L4 16z|M13 5l4 4',
  trash: 'M5 7h14|M9 7V5h6v2|M7 7l1 13h8l1-13',
  note: 'M5 4h11l3 3v13H5z|M9 10h6|M9 14h6',
  share: 'M12 16V4|M8 8l4-4 4 4|M5 14v5h14v-5',
  relax: 'M12 21c-5-3-8-6-8-10a4 4 0 0 1 8-2 4 4 0 0 1 8 2c0 4-3 7-8 10z',
  tree: 'M12 21v-5|M12 16a5 5 0 0 0 0-10 5 5 0 0 0 0 10z|M7 20h10',
  timeline: 'M4 6h16|M4 12h10|M4 18h13|M18 10v4',
  tag: 'M3 11l8-8h9v9l-8 8z|M15 7h.01',
  store: 'M4 9l1-5h14l1 5|M5 9v11h14V9|M9 20v-6h6v6|M4 9h16',
  settings:
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z|M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 3.1a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L5.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 3.1h5l.4-3.1a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  friends: 'M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z|M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M2 20c1-3 3-5 6-5s5 2 6 5|M15 15c2.5 0 4 1.5 5 4',
  achievement: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9z',
  news: 'M5 5h11v14H5z|M16 8h3v9a2 2 0 0 1-2 2|M8 8h5|M8 12h5|M8 16h3',
  realTree: 'M12 21v-7|M12 14c-3 0-6-2-6-6 0-3 3-5 6-5s6 2 6 5c0 4-3 6-6 6z|M6 21h12',
  challenge: 'M8 3h8v5a4 4 0 0 1-8 0z|M8 5H5v2a3 3 0 0 0 3 3|M16 5h3v2a3 3 0 0 1-3 3|M12 12v5|M9 21h6|M10 17h4',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3|M6 11h12v9H6z',
  play: 'M8 5l11 7-11 7z',
  pause: 'M8 5h3v14H8zM13 5h3v14h-3z',
  stop: 'M7 7h10v10H7z',
  mute: 'M4 9h4l5-4v14l-5-4H4z|M16 9l5 6|M21 9l-5 6',
  sound: 'M4 9h4l5-4v14l-5-4H4z|M16 9a4 4 0 0 1 0 6|M18.5 6.5a8 8 0 0 1 0 11',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z|M10 20a2 2 0 0 0 4 0',
  download: 'M12 4v11|M8 11l4 4 4-4|M5 19h14',
  upload: 'M12 15V4|M8 8l4-4 4 4|M5 19h14',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z|M3 12h18|M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z|M12 2v2|M12 20v2|M4.9 4.9l1.4 1.4|M17.7 17.7l1.4 1.4|M2 12h2|M20 12h2|M4.9 19.1l1.4-1.4|M17.7 6.3l1.4-1.4',
  snow: 'M12 3v18|M5 7l14 10|M19 7L5 17|M12 6l2-2-2-1-2 1z|M12 18l2 2-2 1-2-1z',
  tagExpand: 'M4 20h4L20 8l-4-4L4 16z|M13 5l4 4',
  heart: 'M12 20C5 16 3 12.5 4 9.5A4 4 0 0 1 12 7a4 4 0 0 1 8 2.5c-1 3-3 6.5-8 10.5z',
  more: 'M6 12h.01|M12 12h.01|M18 12h.01',
} as const;

export type IconName = keyof typeof ICON_PATHS;

/** Icon name -> semantic key in icon-map.generated.json (P-100). */
// eslint-disable-next-line react-refresh/only-export-components
export const ORIGINAL_ICON_KEYS: Partial<Record<IconName, string>> = {
  menu: 'menu',
  timer: 'modeTimer',
  focus: 'modeFocusOn',
  coin: 'coinLarge',
  plus: 'addCoin',
  gem: 'gem',
  headphone: 'headphone',
  headphoneMute: 'headphoneMute',
  share: 'share',
  tagExpand: 'tagExpand',
  relax: 'drawerRelax',
  tree: 'drawerForest',
  timeline: 'drawerTimeline',
  tag: 'drawerTag',
  store: 'drawerStore',
  settings: 'drawerSettings',
  shield: 'drawerShield',
  friends: 'drawerFriend',
  achievement: 'drawerAchievement',
  news: 'drawerNews',
  realTree: 'drawerRealTree',
  challenge: 'drawerChallenge',
  snow: 'snow',
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  filled?: boolean;
}

export function Icon({ name, size = 24, filled = false, ...rest }: IconProps) {
  const semantic = ORIGINAL_ICON_KEYS[name];
  const url = semantic ? iconUrl(semantic) : null;

  if (url) {
    return (
      <img
        src={url}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        draggable={false}
        className={rest.className}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block', ...rest.style }}
      />
    );
  }

  const paths = ICON_PATHS[name].split('|');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
