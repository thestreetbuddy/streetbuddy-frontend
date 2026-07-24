function IconBase({ children, className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

export function DashboardIcon({ className }) {
  return (
    <IconBase className={className}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
    </IconBase>
  );
}

export function CityIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 20h16" />
      <path d="M6 20V8l5-3v15" />
      <path d="M13 20V6h5v14" />
      <path d="M8 10h1" />
      <path d="M8 13h1" />
      <path d="M8 16h1" />
      <path d="M15 9h1" />
      <path d="M15 12h1" />
      <path d="M15 15h1" />
    </IconBase>
  );
}

export function CategoryIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 3 3.5 7.5 12 12l8.5-4.5L12 3z" />
      <path d="M3.5 12 12 16.5 20.5 12" />
      <path d="M3.5 16.5 12 21l8.5-4.5" />
    </IconBase>
  );
}

export function PlaceIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M12 21s7-5.4 7-11a7 7 0 0 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </IconBase>
  );
}

export function TrendIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 17 9 12l4 4 7-8" />
      <path d="M15 8h5v5" />
    </IconBase>
  );
}

export function UserIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </IconBase>
  );
}

export function LogoutIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M10 5H5v14h5" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </IconBase>
  );
}

export function CloseIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconBase>
  );
}
