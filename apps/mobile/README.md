# AyarFarm Mobile App

Mobile application for farmers to access agricultural resources and management tools.

## Getting Started

```bash
flutter pub get
flutter run
```

## Build

```bash
# Android
flutter build apk

# iOS
flutter build ios

# Web
flutter build web
```

## Tech Stack

- **Flutter 3.7+** with Dart
- **http** - API communication
- **geolocator** - Location services
- **Socket.io** - Real-time communication

## Project Structure

### `/lib/screens`
Main application screens:
- `welcome_screen.dart` - Welcome/onboarding
- `login_screen.dart`, `register_screen.dart` - Authentication
- `forgot_password_screen.dart`, `reset_password_screen.dart`, `verify_screen.dart` - Password recovery
- `main_screen.dart` - Main navigation container
- `home_screen.dart` - Home dashboard
- `category_screen.dart`, `category_navigator.dart` - Category browsing
- `crop_screen.dart` - Crop management
- `calculator_screen.dart` - Agricultural calculator
- `market_screen.dart` - Market prices
- `weather_screen.dart` - Weather information
- `chatting_screen.dart` - Chat/messaging

### `/lib/widgets`
Reusable UI components:
- `ui/` - Custom UI components (buttons, cards, text fields, loading spinner, empty state)
- `layout/` - Layout components
- `common_header.dart` - Shared header component
- `common_bottom_nav.dart` - Bottom navigation bar

### `/lib/services`
API and service integrations:
- `api_service.dart` - HTTP API client
- `auth_service.dart` - Authentication service
- `socket_service.dart` - Socket.io client

### `/lib/models`
Data models:
- `user.dart` - User model

### `/lib/constants`
- `api_constants.dart` - API endpoints and configuration
- `user_types.dart` - User type definitions

### Root Files
- `main.dart` - App entry point

## Development

### Adding New Screen
1. Create screen file in `lib/screens/`
2. Add route navigation in main navigation

### Adding New Widget
Create reusable widgets in `lib/widgets/ui/` or `lib/widgets/layout/`

### API Integration
Use `api_service.dart` for HTTP requests and `socket_service.dart` for real-time features

### Environment Configuration
Update `api_constants.dart` with API base URL

## Learn More

- [Flutter Documentation](https://docs.flutter.dev/)
- [Dart Language](https://dart.dev/)
