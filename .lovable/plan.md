

# 3D Card Effect for Hero Carousel

## Overview
Transform the existing hero section carousel into an immersive 3D card experience. Each carousel slide will feature interactive 3D perspective effects on hover, with text overlays and optional CTA buttons that respond to mouse movement.

---

## What Will Change

### Visual Effects
- Cards tilt and rotate based on mouse position (3D perspective)
- Elements within cards "float" at different depths (translateZ)
- Smooth transitions when hovering/leaving cards
- Text and buttons appear to pop out from the image

### Content Structure
Each card will include:
- Background image (existing)
- Title text (floating at depth)
- Description/subtitle (floating at greater depth)
- Optional CTA button (highest depth)
- All with 3D perspective transforms

---

## Implementation Approach

### Step 1: Create the 3D Card Components
Create a new file `src/components/ui/3d-card.tsx` containing:
- `CardContainer` - Wrapper that tracks mouse position and applies rotation
- `CardBody` - The 3D-transformed card body
- `CardItem` - Individual elements with customizable translateZ depth
- `MouseEnterContext` - Context to share hover state between components

### Step 2: Update Hero Carousel Data Structure
Extend the `heroImages` array to include:

```text
{
  src: string,           // Image source
  alt: string,           // Alt text
  title?: string,        // Optional title overlay
  description?: string,  // Optional description
  ctaText?: string,      // Optional button text
  ctaLink?: string       // Optional button link
}
```

### Step 3: Redesign HeroCarousel Component
Replace the current flat image display with 3D cards:
- Wrap each slide in `CardContainer` for mouse tracking
- Use `CardBody` for the image container
- Layer `CardItem` elements for text and buttons at different depths
- Maintain existing auto-play, pause-on-hover, and dot indicators

### Step 4: Styling Considerations
- Dark gradient overlay on images for text readability
- Text with drop shadows for visibility
- Responsive design (3D effect may be reduced on touch devices)
- Maintain aspect ratio and rounded corners

---

## Technical Details

### Files to Create
| File | Description |
|------|-------------|
| `src/components/ui/3d-card.tsx` | Core 3D card components with perspective transforms |

### Files to Modify
| File | Description |
|------|-------------|
| `src/components/home/HeroCarousel.tsx` | Integrate 3D cards, add content data structure |

---

## 3D Card Component Structure

```text
CardContainer (perspective: 1000px)
├── tracks mouse position
├── applies rotateX/rotateY based on cursor
└── provides MouseEnterContext

CardBody (preserve-3d transform)
└── contains all card content

CardItem (individual depth layers)
├── translateZ: 50px  → Title (subtle float)
├── translateZ: 60px  → Description (medium float)
├── translateZ: 100px → Image (base layer)
└── translateZ: 20px  → CTA Button (prominent float)
```

---

## Enhanced Hero Data Structure

```text
Example Card:
─────────────────────────────
Image: awareness-banner.png
Title: "Stop Elder Abuse"
Description: "Join our campaign against domestic abuse of elderly"
CTA: "Learn More" → /about
─────────────────────────────
```

Suggested content for each image:
1. **Awareness Banner** - "Stop Elder Abuse" with CTA to Legal Resources
2. **Family Illustration** - "Family Support Network" with CTA to About
3. **Elder Abuse Awareness** - "World Elder Abuse Awareness Day" with CTA to Volunteer
4. **Cloth Distribution** - "Community Outreach" with CTA to Donate
5. **Team Event** - "Join Our Team" with CTA to Volunteer
6. **Organization Collage** - "Our Impact" with CTA to About

---

## Mobile/Touch Considerations
- 3D effect works on hover (desktop)
- On touch devices: subtle static tilt or tap-to-activate
- Maintain swipe functionality for carousel
- Text overlays always visible on mobile

---

## Visual Hierarchy on Each Card

```text
┌─────────────────────────────────────┐
│                                     │
│         [Background Image]          │
│                                     │
│    ┌─────────────────────────┐      │
│    │   TITLE (bold, large)   │ ← translateZ: 50
│    │                         │      │
│    │   Description text      │ ← translateZ: 60
│    │   with subtle style     │      │
│    │                         │      │
│    │   [ CTA Button ]        │ ← translateZ: 20
│    └─────────────────────────┘      │
│                                     │
│  ● ● ● ○ ○ ○  (dot indicators)      │
└─────────────────────────────────────┘
```

---

## Dependencies
- Uses existing `cn` utility from `@/lib/utils`
- React Context for mouse state sharing
- CSS transforms with preserve-3d
- No additional packages required

