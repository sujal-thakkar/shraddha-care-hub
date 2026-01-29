
# Mobile Carousel for Projects & Events Section

## Overview
Transform the Projects & Events section on the Corporate Care page to display cards in a horizontal carousel format on mobile devices, with auto-play functionality and swipe gesture support. On larger screens (tablets and desktops), the current grid layout will be preserved.

---

## What Will Change

### Mobile View (screens < 768px)
- Cards displayed horizontally in a carousel, one card visible at a time
- Auto-carousel that advances every 4 seconds
- Swipe gesture support for manual navigation (built into Embla Carousel)
- Dot indicators to show current position and total slides
- Auto-play pauses when user interacts with the carousel

### Desktop/Tablet View (screens >= 768px)
- Current grid layout preserved (2 columns on tablet, 3 columns on desktop)
- No changes to existing functionality

---

## Implementation Details

### Responsive Layout Strategy
The component will use the existing `useIsMobile` hook to detect screen size and conditionally render either:
- **Mobile**: Carousel component with auto-play
- **Desktop**: Current CSS grid layout

### Technical Approach

**File to Modify:** `src/components/corporate/ProjectsEventsSection.tsx`

**Changes:**
1. Import the existing Carousel components from `@/components/ui/carousel`
2. Import the `useIsMobile` hook from `@/hooks/use-mobile`
3. Add state for carousel API and auto-play pause control
4. Implement auto-play using `setInterval` (following the pattern from `ImpactGallery.tsx`)
5. Create conditional rendering based on mobile detection
6. Add dot indicators for slide position feedback

### Code Structure

```text
ProjectsEventsSection
├── useIsMobile() - detect mobile viewport
├── CarouselApi state - control carousel programmatically
├── isPaused state - track user interaction
├── useEffect for autoplay (4-second interval)
│
└── Render Logic:
    ├── Mobile (isMobile = true):
    │   ├── Carousel wrapper with touch handling
    │   ├── CarouselContent with full-width items
    │   ├── ProjectEventCard for each event
    │   └── Dot indicators for navigation
    │
    └── Desktop (isMobile = false):
        └── Current grid layout (unchanged)
```

### Carousel Configuration
- **Loop**: Enabled for infinite scrolling
- **Align**: "start" for proper card alignment
- **Auto-play**: 4-second interval (matching existing carousels in the project)
- **Pause on interaction**: Carousel pauses when user swipes or touches

### Visual Additions for Mobile
- Dot indicators below the carousel (purple theme)
- Subtle animation on slide change
- Touch-friendly gesture area

---

## Files Affected

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/corporate/ProjectsEventsSection.tsx` | Modify | Add mobile carousel logic with responsive rendering |

---

## Consistency with Existing Patterns
This implementation follows the same patterns used in:
- `ImpactGallery.tsx` - Auto-play with pause on hover, CarouselApi usage
- `HeroCarousel.tsx` - 4-second interval, dot indicators

No new dependencies required - uses existing `embla-carousel-react` package already installed and the Carousel UI components already in the project.
