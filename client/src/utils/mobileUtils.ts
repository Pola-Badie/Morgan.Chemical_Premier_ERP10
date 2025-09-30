
export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

export const isTablet = (): boolean => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = (): boolean => {
  return window.innerWidth >= 1024;
};

export const hasTouchSupport = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

export const getOptimalCardColumns = (): number => {
  if (isMobile()) return 1;
  if (isTablet()) return 2;
  return 3;
};

export const getOptimalTablePageSize = (): number => {
  if (isMobile()) return 5;
  if (isTablet()) return 10;
  return 20;
};

export const shouldUseCompactLayout = (): boolean => {
  return isMobile();
};

export const getButtonSize = (): 'sm' | 'default' | 'lg' => {
  if (isMobile()) return 'default';
  return 'default';
};

export const enableTouchFriendlyFeatures = () => {
  // Add touch-friendly CSS classes
  document.body.classList.add('touch-device');
  
  // Enable smooth scrolling
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Prevent zoom on input focus (iOS)
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }
};
