# Scandic Falkoner Checklist Application - Real-time Database Edition

A React-based checklist application with Firebase real-time database integration for hotel staff to manage shift tasks at Scandic Falkoner hotel.

## 🚀 Features

- **Real-time Synchronization**: Multiple users can work on the same checklist simultaneously
- **User Authentication**: Secure login system for staff members
- **Shift Management**: Support for Night, Morning, and Evening shifts with daily sessions
- **Task Tracking**: Complete tasks with initials tracking and real-time updates
- **Notes System**: Add notes to individual tasks with cloud storage
- **Downtime Reports**: Integrated 3-hour interval downtime tracking
- **Progress Tracking**: Visual progress bar showing completion percentage
- **Offline Resilience**: App works offline and syncs when reconnected
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-deployment**: GitHub Actions integration for automatic deployments

## 🔧 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project (already configured)

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

4. Open [http://localhost:5175](http://localhost:5175) in your browser

## 🔑 Login Credentials

- **Username**: 719
- **Password**: falkoner

## 🌐 Real-time Database Features

- **Live Updates**: Changes appear instantly across all connected devices
- **Daily Sessions**: Each shift gets its own document per day (format: `night_2025-07-19`)
- **Collision Handling**: Multiple users can edit simultaneously without conflicts
- **Connection Status**: Visual indicators show sync status and errors
- **Data Persistence**: All tasks, notes, and completion status automatically saved to cloud

## 🗄️ Database Structure

```
/checklists/{sessionId}
  - shift: "Night" | "Morning" | "Evening"
  - date: Timestamp
  - tasks: Array of task objects
  - downtimeChecklist: Array of downtime items
  - createdAt: Timestamp
  - lastUpdated: Timestamp
```

## 🚀 Deployment

### Firebase Hosting
```bash
# Build and deploy to Firebase
npm run build
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

### GitHub Actions
The app is configured for automatic deployment:
- **Pull Requests**: Preview deployments on every PR
- **Main Branch**: Automatic deployment to live site when merged

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
- **Firebase Firestore** - Real-time database
- **Firebase Hosting** - Static web hosting with CDN
- **Firebase Analytics** - Usage analytics
- **Vite** - Build tool and development server
- **CSS3** - Styling with modern features
- **JavaScript ES6+** - Modern JavaScript features

## Performance Optimizations

- React.memo for expensive components
- useCallback for event handlers
- useMemo for computed values
- Real-time database subscriptions with automatic cleanup
- Optimized CSS with minimal reflows
- Firebase SDK tree-shaking for smaller bundle size

## Accessibility Features

- ARIA labels for screen readers
- Keyboard navigation support
- High contrast colors
- Semantic HTML structure
- Loading states and error messages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📞 Support

Contact Ayush if you find issues with the page.

---

**Version**: 1.1.0 (Real-time Database Edition)  
**Last Updated**: July 19, 2025  
**Firebase Project**: realbase-e7569
4. Submit pull requests for review

## Support

Contact Ayush if you find issues with the application.