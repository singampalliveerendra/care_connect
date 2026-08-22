/**
 * Inline icon set. Deliberately not an icon package — the whole set below is
 * smaller than the dependency would be, and every glyph is drawn on the same
 * 24px grid with a 1.6 stroke so they sit together evenly.
 *
 * Round caps and joins throughout: the sharp-cornered, heavy-filled style most
 * icon libraries default to reads as clinical, which is the register this
 * product is trying to stay out of.
 */

type IconProps = React.SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ----------------------------------------------------------------- brand */

/** The Care Connect mark: two arcs leaning into each other, forming a heart
 *  from a handshake. Used at every size, so it carries no fine detail. */
export function Logomark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M16 24.2c-.5 0-.9-.2-1.2-.5l-5.3-5.2a5 5 0 0 1 6.5-7.5 5 5 0 0 1 6.5 7.5l-5.3 5.2c-.3.3-.7.5-1.2.5Z"
        fill="#fff"
        fillOpacity="0.16"
      />
      <path
        d="m16 23.2-5-4.9a4.2 4.2 0 1 1 5-6.6 4.2 4.2 0 1 1 5 6.6l-5 4.9Z"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M11.6 16.4h2l1.1-2 1.6 3.3 1.1-1.9h2.9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------------------------------------------------------- trust */

export function ShieldCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.8 5.9v5.4c0 4.4 3 8.2 7.2 9.4 4.2-1.2 7.2-5 7.2-9.4V5.9L12 3Z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </Icon>
  );
}

export function BadgeCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 2.8 2.3 1.9 3-.2.4 2.9 2.5 1.7-1.4 2.6 1 2.8-2.8 1.1-.9 2.9-3-.5-2.4 1.8-2.3-1.8-3 .5-.9-2.9-2.8-1.1 1-2.8-1.4-2.6L4.3 7.4l.4-2.9 3 .2L12 2.8Z" />
      <path d="m9.2 12 2 2 3.6-3.7" />
    </Icon>
  );
}

export function FileCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14 3H7a1.8 1.8 0 0 0-1.8 1.8v14.4A1.8 1.8 0 0 0 7 21h10a1.8 1.8 0 0 0 1.8-1.8V7.8L14 3Z" />
      <path d="M13.8 3.2v4.4h4.6" />
      <path d="m9.2 15 1.8 1.8 3.6-3.7" />
    </Icon>
  );
}

export function IdCard(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.2" />
      <circle cx="8.6" cy="11" r="2.1" />
      <path d="M5.2 16.3c.5-1.5 1.8-2.3 3.4-2.3s2.9.8 3.4 2.3M14.8 10h4M14.8 13.4h3" />
    </Icon>
  );
}

/* --------------------------------------------------------------- services */

export function HomeCare(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.4 12 4l8 6.4V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19v-8.6Z" />
      <path d="M12 17.6c-1.6-1.3-3.2-2.5-3.2-4a1.9 1.9 0 0 1 3.2-1.4 1.9 1.9 0 0 1 3.2 1.4c0 1.5-1.6 2.7-3.2 4Z" />
    </Icon>
  );
}

export function Companionship(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8.4" cy="8" r="2.9" />
      <circle cx="16.4" cy="9.6" r="2.4" />
      <path d="M3.2 19.4c.4-3 2.5-4.8 5.2-4.8s4.8 1.8 5.2 4.8M15.4 14.8c2.6.2 4.4 1.9 4.8 4.6" />
    </Icon>
  );
}

export function Rehabilitation(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="14.6" cy="4.9" r="1.9" />
      <path d="m13.4 9-3.6 1.9L8 15M13.4 9c1.2-.5 2.4-.2 3 .8l1.1 1.9 2.3.8" />
      <path d="m13 9.6.8 4.2 2.6 2.4.9 4.4M9.5 13.6 6.4 15l-2.6 3.4" />
    </Icon>
  );
}

export function CognitiveCare(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.4 20.2a3 3 0 0 1-3-3 2.8 2.8 0 0 1-1.3-4.7A2.9 2.9 0 0 1 6 7.4a3 3 0 0 1 3.4-3.6A2.4 2.4 0 0 1 12 5.6v12.2a2.4 2.4 0 0 1-2.6 2.4Z" />
      <path d="M14.6 20.2a3 3 0 0 0 3-3 2.8 2.8 0 0 0 1.3-4.7A2.9 2.9 0 0 0 18 7.4a3 3 0 0 0-3.4-3.6A2.4 2.4 0 0 0 12 5.6" />
    </Icon>
  );
}

export function Medical(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 3v5.2a4.4 4.4 0 0 0 8.8 0V3" />
      <path d="M5 3h2M13.8 3h2M10.4 12.6v2.6a4.2 4.2 0 0 0 8.4 0v-1.4" />
      <circle cx="19" cy="12" r="2" />
    </Icon>
  );
}

export function Palliative(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20.4c-2.6-2-6.6-4.4-6.6-8.3A3.8 3.8 0 0 1 12 9.6a3.8 3.8 0 0 1 6.6 2.5c0 3.9-4 6.3-6.6 8.3Z" />
      <path d="M12 9.6V4.4M9.6 6.2 12 4l2.4 2.2" />
    </Icon>
  );
}

export function Residential(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.4 20.6h17.2M5 20.6V6.4L12 3.4l7 3v14.2" />
      <path d="M9.4 20.6v-4.4h5.2v4.4M9 10h1.6M13.4 10H15" />
    </Icon>
  );
}

/* ----------------------------------------------------------------- meta */

export function MapPin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21c3.6-3.6 6-6.5 6-9.6a6 6 0 0 0-12 0c0 3.1 2.4 6 6 9.6Z" />
      <circle cx="12" cy="11.2" r="2.3" />
    </Icon>
  );
}

export function Phone(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.4 16.9v2.6a1.7 1.7 0 0 1-1.9 1.7 17 17 0 0 1-7.4-2.6 16.7 16.7 0 0 1-5.2-5.2A17 17 0 0 1 3.3 6a1.7 1.7 0 0 1 1.7-1.9h2.6A1.7 1.7 0 0 1 9.3 5.6a11 11 0 0 0 .6 2.6 1.7 1.7 0 0 1-.4 1.8l-1.1 1.1a13.7 13.7 0 0 0 5.2 5.2l1.1-1.1a1.7 1.7 0 0 1 1.8-.4 11 11 0 0 0 2.6.6 1.7 1.7 0 0 1 1.3 1.5Z" />
    </Icon>
  );
}

export function Mail(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.2" />
      <path d="m3.6 7 7.4 5.2a1.8 1.8 0 0 0 2 0L20.4 7" />
    </Icon>
  );
}

export function Globe(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M3.4 12h17.2M12 3.2a13 13 0 0 1 0 17.6 13 13 0 0 1 0-17.6Z" />
    </Icon>
  );
}

export function Clock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 6.8V12l3.4 2" />
    </Icon>
  );
}

export function Users(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9.6" cy="8.4" r="3.2" />
      <path d="M3.6 19.6c.4-3.4 2.8-5.4 6-5.4s5.6 2 6 5.4" />
      <path d="M16.4 5.6a3.2 3.2 0 0 1 0 5.7M17.6 14.6c2.1.6 3.4 2.3 3.7 5" />
    </Icon>
  );
}

export function Rupee(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.4 4.6h9.2M7.4 8.8h9.2M15.6 4.6c0 3.4-1.7 5.6-5 5.6H7.4l7.8 9.2" />
    </Icon>
  );
}

export function Calendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="2.2" />
      <path d="M3.6 10h16.8M8.4 3.4v3.4M15.6 3.4v3.4" />
    </Icon>
  );
}

export function Search(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="m15.6 15.6 4.4 4.4" />
    </Icon>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.4 12h15.2M13.6 6l6 6-6 6" />
    </Icon>
  );
}

export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4.8 12.4 4.8 4.8L19.2 7.6" />
    </Icon>
  );
}

export function Sparkle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.4c.7 4.3 2.3 5.9 6.6 6.6-4.3.7-5.9 2.3-6.6 6.6-.7-4.3-2.3-5.9-6.6-6.6 4.3-.7 5.9-2.3 6.6-6.6Z" />
      <path d="M18.2 16.4c.3 1.9 1 2.6 2.9 2.9-1.9.3-2.6 1-2.9 2.9-.3-1.9-1-2.6-2.9-2.9 1.9-.3 2.6-1 2.9-2.9Z" />
    </Icon>
  );
}

export function Message(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.4 13.6a2.6 2.6 0 0 1-2.6 2.6H8.4L4 20.2V6.4a2.6 2.6 0 0 1 2.6-2.6h11.2a2.6 2.6 0 0 1 2.6 2.6v7.2Z" />
      <path d="M8.4 8.8h7.2M8.4 12h4.8" />
    </Icon>
  );
}

export function Lock(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.6" y="10.4" width="14.8" height="10" rx="2.2" />
      <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" />
    </Icon>
  );
}

export function Menu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7.2h16M4 12h16M4 16.8h16" />
    </Icon>
  );
}

export function Close(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6" />
    </Icon>
  );
}

export function Plane(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.4 12.8 3.6 10.6l1.4-1.4 8.2 1 4.4-4.4a2 2 0 0 1 2.8 2.8l-4.4 4.4 1 8.2-1.4 1.4-2.2-6.8-3.4 3.4v2.6l-1.4 1-1.4-3-3-1.4 1-1.4h2.6l3.4-3.4Z" />
    </Icon>
  );
}

export function Building(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.4 20.6h15.2M6 20.6V4.6a1.2 1.2 0 0 1 1.2-1.2h9.6A1.2 1.2 0 0 1 18 4.6v16" />
      <path d="M9.2 7.4h1.6M13.2 7.4h1.6M9.2 11h1.6M13.2 11h1.6M10.4 20.6v-3.8h3.2v3.8" />
    </Icon>
  );
}

export function Inbox(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.6 13.6h4l1.4 2.4h6l1.4-2.4h4" />
      <path d="M6.2 4.6h11.6l2.6 9v4.8a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2v-4.8l2.6-9Z" />
    </Icon>
  );
}

/* ------------------------------------------------- directory actions */

/**
 * WhatsApp is the exception to the house style: it is a third-party mark that
 * people recognise by its exact silhouette, so it is drawn as a solid glyph on
 * the official geometry rather than restroked to match the set. Filling with
 * `currentColor` keeps it usable on both the white and the green button.
 */
export function WhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.04 2.4a9.5 9.5 0 0 0-8.1 14.4L2.4 21.6l4.9-1.5a9.5 9.5 0 1 0 4.74-17.7Zm0 1.72a7.78 7.78 0 1 1-3.98 14.47l-.3-.18-2.9.88.9-2.82-.2-.31A7.78 7.78 0 0 1 12.04 4.12Zm-3.5 3.6c-.17 0-.44.06-.67.3-.23.25-.88.85-.88 2.08s.9 2.41 1.03 2.58c.13.16 1.75 2.79 4.32 3.8 2.13.83 2.57.67 3.03.63.46-.05 1.5-.61 1.71-1.2.21-.6.21-1.1.15-1.21-.07-.1-.24-.17-.5-.3-.25-.13-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.12-.17.26-.65.83-.8 1-.15.16-.29.19-.54.06-.25-.12-1.07-.4-2.04-1.26-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.44.12-.15.16-.25.25-.42.08-.17.04-.32-.02-.44-.06-.13-.56-1.37-.77-1.87-.2-.49-.4-.42-.55-.43h-.47Z" />
    </svg>
  );
}

/** A handset in a filled disc — the "call now" affordance on a listing needs
 *  more weight than the outline Phone used in body copy. */
export function PhoneCall(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.6 3.2h2.2a1.7 1.7 0 0 1 1.7 1.5c.1.9.3 1.7.6 2.5a1.7 1.7 0 0 1-.4 1.8l-1 1a13.7 13.7 0 0 0 5.3 5.3l1-1a1.7 1.7 0 0 1 1.8-.4c.8.3 1.6.5 2.5.6a1.7 1.7 0 0 1 1.5 1.7v2.2a1.8 1.8 0 0 1-2 1.8A17.6 17.6 0 0 1 4.8 5.2a1.8 1.8 0 0 1 1.8-2Z" />
    </svg>
  );
}

/** Arrow-in-a-pin: opens the listing's dropped coordinates in a maps app. */
export function Directions(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <path d="m9.4 10.6 5.4-2.2-2.2 5.4-1-2.2-2.2-1Z" />
    </Icon>
  );
}

/** Sliders — the filter bar's "all filters" control. */
export function Filter(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7.2h10M17.6 7.2H20M4 16.8h2.4M10 16.8h10" />
      <circle cx="15.6" cy="7.2" r="2.2" />
      <circle cx="8.2" cy="16.8" r="2.2" />
    </Icon>
  );
}

/* --------------------------------------------------- category → icon map */

const CATEGORY_ICONS: Record<string, (props: IconProps) => React.ReactElement> = {
  "home-care": HomeCare,
  companionship: Companionship,
  rehabilitation: Rehabilitation,
  "cognitive-care": CognitiveCare,
  medical: Medical,
  palliative: Palliative,
  residential: Residential,
};

/** Falls back to the home-care glyph so a new category added in Studio still
 *  renders rather than punching a hole in the grid. */
export function CategoryIcon({
  slug,
  ...props
}: IconProps & { slug: string }) {
  const Glyph = CATEGORY_ICONS[slug] ?? HomeCare;
  return <Glyph {...props} />;
}

/* --------------------------------------------------------- social sign-in */

/**
 * The Google mark. Like WhatsApp above it is a third-party logo, so it keeps
 * its official geometry and its own colours — Google's brand terms require the
 * mark to be reproduced exactly, and a recoloured sign-in button is the
 * fastest way to make a login page look like a phishing page.
 */
export function Google({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.83-.07-1.62-.21-2.39H12v4.51h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.56-5.15 3.56-8.74Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.23 0 5.94-1.07 7.92-2.9l-3.86-3c-1.07.72-2.44 1.15-4.06 1.15-3.12 0-5.76-2.1-6.7-4.94H1.3v3.1A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.31a7.2 7.2 0 0 1 0-4.61v-3.1H1.3a12 12 0 0 0 0 10.81l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.94 1.18 15.23 0 12 0 7.3 0 3.24 2.7 1.3 6.6l4 3.1C6.24 6.85 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}
