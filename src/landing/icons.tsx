import type { ReactNode, SVGProps } from 'react'

// Icons drawn for the landing in Figma (land-liveschema), kept as-is
type IconProps = SVGProps<SVGSVGElement>

const Icon = ({ children, className = 'size-5', ...props }: IconProps & { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
)

export const ArrowRight = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

export const Check = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12 4 4L19 6" />
  </Icon>
)

export const Database = (props: IconProps) => (
  <Icon {...props}>
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </Icon>
)

export const Sparkles = (props: IconProps) => (
  <Icon {...props}>
    <path d="m12 3-1.1 3.2a3.9 3.9 0 0 1-2.5 2.5L5 10l3.4 1.2a3.9 3.9 0 0 1 2.5 2.5L12 17l1.1-3.3a3.9 3.9 0 0 1 2.5-2.5L19 10l-3.4-1.2a3.9 3.9 0 0 1-2.5-2.5L12 3Z" />
    <path d="m5 17-.5 1.2a2 2 0 0 1-1.2 1.2L2 20l1.3.5a2 2 0 0 1 1.2 1.2L5 23l.5-1.3a2 2 0 0 1 1.2-1.2L8 20l-1.3-.6a2 2 0 0 1-1.2-1.2L5 17Z" />
  </Icon>
)

export const Diagram = (props: IconProps) => (
  <Icon {...props}>
    <rect x="3" y="3" width="7" height="6" rx="1.5" />
    <rect x="14" y="15" width="7" height="6" rx="1.5" />
    <path d="M10 6h3a4 4 0 0 1 4 4v5M7 9v4a4 4 0 0 0 4 4h3" />
  </Icon>
)

export const Key = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 8-8M15 8l2 2M17 6l2 2" />
  </Icon>
)

export const Download = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
  </Icon>
)

export const Cloud = (props: IconProps) => (
  <Icon {...props}>
    <path d="M17.5 19H6a4 4 0 0 1-.6-8A7 7 0 0 1 19 9.5a4.8 4.8 0 0 1-1.5 9.5Z" />
  </Icon>
)


export const Menu = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
)

export const X = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
)

export const Chevron = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
)

export const Github = (props: IconProps) => (
  <Icon {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7.4A5.8 5.8 0 0 0 19.3 3 5.4 5.4 0 0 0 19.1 0S17.9-.4 15 1.6a14 14 0 0 0-6 0C6.1-.4 4.9 0 4.9 0a5.4 5.4 0 0 0-.2 3A5.8 5.8 0 0 0 3.2 7.1c0 5.8 3.5 7 6.8 7.4A4.8 4.8 0 0 0 9 18v4" />
    <path d="M9 19c-3 .9-3-1.5-4.2-2" />
  </Icon>
)

export const LinkedIn = (props: IconProps) => (
  <Icon {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2a5 5 0 0 1 2-3ZM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </Icon>
)
