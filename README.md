# Scandic Falkoner Checklist Application

A React-based checklist application for hotel staff to manage shift tasks at Scandic Falkoner hotel.

## Features

- **User Authentication**: Secure login system for staff members
- **Shift Management**: Support for Night, Morning, and Evening shifts
- **Task Tracking**: Complete tasks with initials tracking and timestamps
- **Notes System**: Add notes to individual tasks
- **Progress Tracking**: Visual progress bar showing completion percentage
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── App.jsx          # Main application component
├── App.css          # Application styles
├── main.jsx         # React entry point
├── users.js         # User authentication data
└── Checklists/      # Shift checklist definitions
    ├── index.js     # Checklist exports
    ├── night.js     # Night shift tasks
    ├── morning.js   # Morning shift tasks
    └── evening.js   # Evening shift tasks
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and development server
- **CSS3** - Styling with modern features
- **JavaScript ES6+** - Modern JavaScript features

## Performance Optimizations

- React.memo for expensive components
- useCallback for event handlers
- useMemo for computed values
- Optimized CSS with minimal reflows
- Lazy loading where appropriate

## Accessibility Features

- ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors
- Semantic HTML structure

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Submit pull requests for review

## Support

Contact Ayush if you find issues with the application.