

# Dynamic Projects & Events Section for Corporate Care Page

## Overview
Replace the static "What Our Partners Say" testimonials section on the Corporate Care page with a dynamic, database-driven table showcasing **ongoing and upcoming projects/events** from Shraddha and Hosla. This feature will demonstrate organizational activity and future plans to corporate viewers while providing admin-side management capabilities.

---

## What This Will Include

### For Corporate Viewers (Public Page)
- A visually appealing table/card view displaying upcoming and ongoing projects
- Clear categorization with status badges (Upcoming / Ongoing)
- Event details including title, description, dates, and resource links
- Maintains the existing purple/blue corporate color theme

### For Administrators
- New "Projects & Events" section in the admin dashboard
- Full CRUD (Create, Read, Update, Delete) capabilities
- Status management (upcoming, ongoing, completed)
- Option to hide/show events on the public page

---

## Database Schema

A new `projects_events` table will be created with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Event/project title |
| description | TEXT | Detailed description |
| start_date | DATE | When it begins |
| end_date | DATE | When it ends (optional) |
| status | ENUM | 'upcoming', 'ongoing', 'completed' |
| resource_link | TEXT | URL for more details/registration |
| organization | ENUM | 'shraddha', 'hosla', 'both' |
| is_published | BOOLEAN | Whether visible on public page |
| display_order | INTEGER | For custom sorting |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Security
- **Public SELECT**: Only published, non-completed events visible
- **Admin-only**: Full access for INSERT, UPDATE, DELETE operations

---

## Implementation Steps

### Step 1: Database Setup
- Create the `projects_events` table with appropriate columns
- Add enum type for status and organization
- Set up RLS policies:
  - Public can view published upcoming/ongoing events
  - Admins have full management access

### Step 2: Admin Panel - Projects Management Page
Create a new admin page (`src/pages/admin/ProjectsEvents.tsx`) featuring:
- List view of all projects/events with filtering by status
- Add/Edit dialog with form fields for all event details
- Date pickers for start and end dates
- Status dropdown (upcoming, ongoing, completed)
- Organization selection (Shraddha, Hosla, Both)
- Toggle for published/unpublished
- Delete functionality with confirmation

### Step 3: Update Admin Dashboard Navigation
- Add new navigation item with Calendar icon
- Route: `/admin/dashboard/projects`
- Position it appropriately in the sidebar

### Step 4: Corporate Care Page Component
Replace the testimonials section with a new `ProjectsEventsSection` component:
- Fetch published upcoming and ongoing events from database
- Display in a styled table/card format matching page aesthetics
- Purple gradient header matching the page theme
- Status badges with purple color scheme
- Clickable resource links
- Empty state message if no events

### Step 5: Update App Routes
- Add the new admin route for projects management

---

## Visual Design

The new section will maintain the Corporate Care page's premium purple theme:
- Section background: Gradient purple overlay (matching existing testimonials section)
- Table header: Purple gradient background
- Status badges:
  - **Upcoming**: Light purple with purple text
  - **Ongoing**: Blue/teal accent
- Resource links: Purple-styled buttons/links
- Cards with subtle purple borders and hover effects

---

## Technical Details

### Files to Create
1. `src/pages/admin/ProjectsEvents.tsx` - Admin management page
2. `src/components/corporate/ProjectsEventsSection.tsx` - Public display component

### Files to Modify
1. `src/App.tsx` - Add new admin route
2. `src/pages/admin/Dashboard.tsx` - Add navigation item
3. `src/pages/CorporateCare.tsx` - Replace testimonials with new component

### Database Changes
1. Create `project_status` enum type
2. Create `organization_type` enum type
3. Create `projects_events` table
4. Set up RLS policies

### Dependencies
- Uses existing shadcn/ui components (Table, Badge, Button, Dialog)
- Uses existing date-fns for date formatting
- Uses existing Shadcn DatePicker/Calendar for date selection

---

## Sample Data Structure

```text
Example Entry:
--------------
Title: Community Awareness Camp - Purulia
Description: Elder care awareness program in rural Purulia district
Start Date: 2026-02-15
End Date: 2026-02-16
Status: Upcoming
Organization: Shraddha
Resource Link: https://forms.google.com/...
Published: Yes
```

---

## Admin UI Preview

The admin panel will show:
- Filter tabs: All | Upcoming | Ongoing | Completed
- Table columns: Title, Organization, Dates, Status, Published, Actions
- Quick actions: Edit, Toggle Published, Delete
- Add button with full form dialog

---

## Security Considerations

- RLS policies ensure only admins can modify data
- Public users can only view published, non-completed events
- Input validation on all form fields
- Maximum character limits enforced

