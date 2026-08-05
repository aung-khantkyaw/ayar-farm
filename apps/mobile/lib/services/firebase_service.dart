import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';
import 'auth_service.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  static FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  factory FirebaseService() {
    return _instance;
  }

  FirebaseService._internal();

  Future<void> init() async {
    // Initialize Firebase with platform-specific options
    if (kIsWeb) {
      // For web, we need to provide Firebase configuration
      // This configuration should match your Firebase project settings
      await Firebase.initializeApp(
        options: const FirebaseOptions(
          apiKey: "AIzaSyBs-nxDgGJoxO1_vTNObU1U_I2kCyytE8s",
          authDomain: "ayar-farm-link.firebaseapp.com",
          projectId: "ayar-farm-link",
          storageBucket: "ayar-farm-link.firebasestorage.app",
          messagingSenderId: "973534401395",
          appId: "1:973534401395:web:6e4e0b49dbe78d0e4d6b06",
          measurementId: "G-0NKK55XLYC",
        ),
      );
    } else {
      // For mobile platforms, use default initialization
      await Firebase.initializeApp();
    }

    // Only initialize messaging on mobile platforms
    if (!kIsWeb) {
      // Request permission for notifications
      await _requestPermission();

      // Get device token
      String? token = await FirebaseMessaging.instance.getToken();
      debugPrint('FCM Token: $token');

      // Register token with our API only if user is authenticated
      if (token != null) {
        // Attempt to register token, but don't fail if user isn't authenticated yet
        // The token will be registered when the user logs in
        _attemptTokenRegistration(token);
      }

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint(
          'Foreground message received: ${message.notification?.title}',
        );
        _handleNotificationReceived(message);
      });

      // Handle background messages
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint(
          'Background message opened app: ${message.notification?.title}',
        );
        _handleNotificationOpened(message);
      });

      // Handle messages when app is terminated
      RemoteMessage? initialMessage =
          await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationOpened(initialMessage);
      }

      // Listen for token refresh
      FirebaseMessaging.instance.onTokenRefresh
          .listen((String newToken) {
            debugPrint('Token refreshed: $newToken');
            _attemptTokenRegistration(newToken);
          })
          .onError((error) {
            debugPrint('Token refresh error: $error');
          });

      // Subscribe to announcements topic
      await _subscribeToTopics();
    } else {
      debugPrint('Running on web - Firebase Messaging not supported');
    }

    // Initialize local notifications plugin
    await _initLocalNotifications();
  }

  // Public method to register device token after user authentication
  Future<void> registerDeviceTokenAfterLogin() async {
    if (kIsWeb) {
      debugPrint('Registering device token not supported on web');
      return;
    }

    String? token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      debugPrint('Attempting to register device token after login: $token');
      await _attemptTokenRegistration(token);
    } else {
      debugPrint('No FCM token available to register');
    }
  }

  // Helper method to attempt token registration, ignoring auth errors
  Future<void> _attemptTokenRegistration(String token) async {
    try {
      await _registerTokenWithAPI(token);
    } catch (e) {
      // Only log non-authentication errors
      if (!e.toString().contains('401') && !e.toString().contains('403')) {
        debugPrint('Error registering device token: $e');
      } else {
        debugPrint('Authentication required to register device token - will retry when user logs in');
      }
    }
  }

  Future<void> _requestPermission() async {
    if (kIsWeb) {
      debugPrint('Requesting notification permission not supported on web');
      return;
    }

    NotificationSettings settings = await FirebaseMessaging.instance
        .requestPermission(
          alert: true,
          announcement: false,
          badge: true,
          carPlay: false,
          criticalAlert: false,
          provisional: false,
          sound: true,
        );

    debugPrint(
      'Notification permission granted: ${settings.authorizationStatus}',
    );
  }

  Future<void> _registerTokenWithAPI(String token) async {
    if (kIsWeb) {
      debugPrint('Registering device token not supported on web');
      return;
    }

    // Check if user is authenticated before attempting to register token
    final currentUser = AuthService.currentUser;
    if (currentUser == null) {
      debugPrint('User not authenticated, skipping device token registration');
      return;
    }

    try {
      // Determine platform
      String platform = Platform.isAndroid ? 'android' : 'ios';

      // Register token with API
      await ApiService.post('${ApiConstants.deviceToken}/register', {
        'token': token,
        'platform': platform,
      });

      debugPrint('Device token registered with API: $token');
    } catch (e) {
      debugPrint('Failed to register device token with API: $e');
    }
  }

  Future<void> _subscribeToTopics() async {
    if (kIsWeb) {
      debugPrint('Subscribing to topics not supported on web');
      return;
    }

    try {
      // Subscribe to announcements topic
      await FirebaseMessaging.instance.subscribeToTopic('announcements');
      debugPrint('Subscribed to announcements topic');
    } catch (e) {
      debugPrint('Failed to subscribe to announcements topic: $e');
    }
  }

  Future<void> _initLocalNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
          requestSoundPermission: true,
          requestBadgePermission: true,
          requestAlertPermission: true,
        );

    const InitializationSettings initializationSettings =
        InitializationSettings(
          android: initializationSettingsAndroid,
          iOS: initializationSettingsIOS,
        );

    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (details) {
        debugPrint('Local notification tapped: ${details.payload}');
      },
    );
  }

  void _handleNotificationReceived(RemoteMessage message) {
    if (kIsWeb) {
      debugPrint('Handling notification received not supported on web');
      return;
    }

    RemoteNotification? notification = message.notification;
    if (notification != null) {
      // Show local notification
      _showLocalNotification(
        title: notification.title ?? '',
        body: notification.body ?? '',
        payload: message.data.toString(),
      );
    }
  }

  void _handleNotificationOpened(RemoteMessage message) {
    if (kIsWeb) {
      debugPrint('Handling notification opened not supported on web');
      return;
    }

    debugPrint('Notification opened: ${message.data}');
    // Handle navigation based on notification type
    String? type = message.data['type'];
    String? announcementId = message.data['announcementId'];

    if (type == 'announcement' && announcementId != null) {
      // You could navigate to a specific announcement screen here
      // For now, we'll just print the event
      debugPrint('Opening announcement details for ID: $announcementId');
    }
  }

  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (kIsWeb) {
      debugPrint('Showing local notification not supported on web');
      return;
    }

    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
          'announcement_channel',
          'Announcement Notifications',
          channelDescription: 'Notifications for announcements',
          importance: Importance.max,
          priority: Priority.high,
          showWhen: true,
        );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
    );

    await flutterLocalNotificationsPlugin.show(
      DateTime.now().millisecondsSinceEpoch % 100000,
      title,
      body,
      platformChannelSpecifics,
      payload: payload,
    );
  }
}
