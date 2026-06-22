interface IconProps {
  className?: string;
}

export function GoogleMeetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M13 6v3.5l3.5-2.7V6.6c0-.9-1-1.4-1.7-.9L13 6z" fill="#fff" opacity="0" />
      <path d="M2 8.5A1.5 1.5 0 0 1 3.5 7H12v10H3.5A1.5 1.5 0 0 1 2 15.5v-7z" fill="#00832d" />
      <path d="M12 7v10h4.5l3.5 2.7V4.3L16.5 7H12z" fill="#0066da" />
      <path d="M12 7v3.5L16.5 7H12z" fill="#e94235" />
      <path d="M12 17v-3.5L16.5 17H12z" fill="#2684fc" />
      <path d="M20 4.3 16.5 7v10l3.5 2.7c.7.5 1.5 0 1.5-.8V5.1c0-.8-.8-1.3-1.5-.8z" fill="#00ac47" />
      <path d="M16.5 7v10l3.5 2.7V4.3L16.5 7z" fill="#ffba00" opacity="0" />
    </svg>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z"
        fill="#FF0000"
      />
      <path d="M9.6 15.6V8.4l6.2 3.6-6.2 3.6z" fill="#fff" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z"
        fill="#1877F2"
      />
      <path d="M16.7 15.5 17.2 12h-3.3V9.8c0-1 .5-1.9 2-1.9h1.5V5c0 0-1.4-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.6V12h-3v3.5h3v8.4c.6.1 1.3.1 1.9.1s1.3 0 1.9-.1v-8.4h2.8z" fill="#fff" />
    </svg>
  );
}
