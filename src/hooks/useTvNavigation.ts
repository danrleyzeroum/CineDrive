import { useEffect } from 'react';

/**
 * useTvNavigation: Global keyboard / remote D-Pad navigation for Android TV.
 * Supports:
 * - Arrow Keys: Focus moving between focusable TV elements smoothly
 * - Enter / Space: Activate focused item
 * - Backspace / Escape: Back action / Close modals
 * - Quick keys for TV remote: Play/Pause, Media keys
 */
export function useTvNavigation(options?: {
  onBack?: () => void;
  isEnabled?: boolean;
}) {
  const { onBack, isEnabled = true } = options || {};

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape or Backspace (when not in text input) for Android TV Back Button
      if (e.key === 'Escape' || (e.key === 'Backspace' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))) {
        if (onBack) {
          e.preventDefault();
          onBack();
        }
        return;
      }

      // If user is typing in search input, don't intercept arrow navigation
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Directional arrow navigation on Android TV D-Pad
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const focusableSelectors = [
          '[tabindex="0"]',
          'button:not([disabled]):not([tabindex="-1"])',
          'a[href]',
          'input:not([disabled])',
        ].join(',');

        const focusables = Array.from(
          document.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
        });

        if (focusables.length === 0) return;

        const currentActive = document.activeElement as HTMLElement | null;

        // If no element is active, focus the first available TV element
        if (!currentActive || !focusables.includes(currentActive)) {
          if (focusables[0]) {
            e.preventDefault();
            focusables[0].focus();
            focusables[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
          }
          return;
        }

        const currentRect = currentActive.getBoundingClientRect();
        const currentCenter = {
          x: currentRect.left + currentRect.width / 2,
          y: currentRect.top + currentRect.height / 2,
        };

        // Find best candidate in the direction of the arrow key
        let bestCandidate: HTMLElement | null = null;
        let minDistance = Infinity;

        for (const el of focusables) {
          if (el === currentActive) continue;
          const rect = el.getBoundingClientRect();
          const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };

          const dx = center.x - currentCenter.x;
          const dy = center.y - currentCenter.y;

          let isCandidate = false;

          switch (e.key) {
            case 'ArrowRight':
              isCandidate = dx > 15;
              break;
            case 'ArrowLeft':
              isCandidate = dx < -15;
              break;
            case 'ArrowDown':
              isCandidate = dy > 15;
              break;
            case 'ArrowUp':
              isCandidate = dy < -15;
              break;
          }

          if (isCandidate) {
            // Weighted distance prioritizing primary movement axis
            const primaryDist = e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? Math.abs(dx) : Math.abs(dy);
            const secondaryDist = e.key === 'ArrowLeft' || e.key === 'ArrowRight' ? Math.abs(dy) : Math.abs(dx);
            const distance = primaryDist + secondaryDist * 2.5;

            if (distance < minDistance) {
              minDistance = distance;
              bestCandidate = el;
            }
          }
        }

        if (bestCandidate) {
          e.preventDefault();
          bestCandidate.focus();
          bestCandidate.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled, onBack]);
}
