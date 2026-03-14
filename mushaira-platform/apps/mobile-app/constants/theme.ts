export const Colors = {
  primary: '#5B2C83',
  primaryDark: '#461E68',
  primaryLight: '#7A3DAF',
  accent: '#D4AF37',
  accentLight: '#EED966',

  background: '#FFFFFF',
  surface: '#F8F5FC',
  surfaceBorder: '#E8DFF5',

  text: {
    primary: '#1A1A2E',
    secondary: '#6B6B8A',
    muted: '#A0A0B8',
    inverse: '#FFFFFF',
    accent: '#D4AF37',
  },

  status: {
    success: '#27AE60',
    successBg: '#E8F8EF',
    warning: '#F39C12',
    warningBg: '#FEF5E4',
    error: '#E74C3C',
    errorBg: '#FDEDEC',
    info: '#3498DB',
    infoBg: '#EBF5FB',
  },

  registration: {
    PENDING: '#F39C12',
    APPROVED: '#27AE60',
    REJECTED: '#E74C3C',
    WAITLIST: '#3498DB',
    CHECKED_IN: '#5B2C83',
  } as Record<string, string>,

  event: {
    PUBLISHED: '#27AE60',
    LIVE: '#E74C3C',
    COMPLETED: '#6B6B8A',
    CANCELLED: '#E74C3C',
    DRAFT: '#F39C12',
  } as Record<string, string>,
} as const;

export const Fonts = {
  heading: 'PlayfairDisplay_700Bold',
  headingRegular: 'PlayfairDisplay_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#5B2C83',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#5B2C83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;
