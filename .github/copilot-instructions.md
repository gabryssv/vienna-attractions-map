<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Vienna Map Application

This is a Next.js application that displays an interactive map of Vienna (Austria) with tourist attractions marked as markers with popups.

## Project Structure
- `/app` - Next.js App Router pages and layout
- `/components` - React components including ViennaMap and AttractionList
- `/data` - TypeScript data files with attraction information
- `/public` - Static assets

## Key Technologies
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- React Leaflet for interactive maps
- Leaflet for map functionality

## Components
- `ViennaMap` - Interactive map component with markers and popups
- `AttractionList` - Sidebar component listing all attractions

## Data
The attractions data includes 12 tourist attractions in Vienna with:
- Name (in Polish)
- Address
- Latitude and longitude coordinates

## Styling
- Uses Tailwind CSS for styling
- Responsive design that works on mobile and desktop
- Custom popup styling for map markers