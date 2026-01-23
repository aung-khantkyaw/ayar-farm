import 'dart:convert';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);
  final ValueNotifier<List<AppNotification>> notifications =
      ValueNotifier<List<AppNotification>>(<AppNotification>[]);

  factory NotificationService() {
    return _instance;
  }

  NotificationService._internal();

  Future<void> init() async {
    // Android initialization
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS initialization
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

    await _notificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification tap (navigate via payload elsewhere)
        debugPrint('Notification tapped: ${details.payload}');
      },
    );
  }

  void handleIncomingRemote(Map<String, dynamic> data) {
    final notification = AppNotification.fromMap(data);

    // Persist in-memory list for badge + screen
    final current = List<AppNotification>.from(notifications.value);
    current.insert(0, notification);
    notifications.value = current;

    // Increment unread badge
    unreadCount.value = unreadCount.value + 1;

    // Show local banner/notification
    showNotification(
      id: notification.id.hashCode & 0x7fffffff,
      title: _titleFor(notification),
      body: notification.message,
      payload: jsonEncode({
        'postId': notification.postId,
        'commentId': notification.commentId,
        'type': notification.type,
      }),
    );
  }

  Future<void> fetchForUser(String userId) async {
    if (userId.isEmpty) return;
    try {
      final res = await ApiService.get(
        '${ApiConstants.notifications}/user/$userId',
      );
      final items = (res['data'] as List?) ?? [];
      final parsed =
          items
              .whereType<Map>()
              .map((n) => AppNotification.fromMap(Map<String, dynamic>.from(n)))
              .toList();
      notifications.value = parsed;
      unreadCount.value = parsed.where((n) => n.unread).length;
    } catch (e) {
      debugPrint('Failed to fetch notifications: $e');
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await ApiService.put('${ApiConstants.notifications}/$id/read', {});
      final current = notifications.value
          .map((n) => n.id == id ? n.copyWith(unread: false) : n)
          .toList(growable: false);
      notifications.value = current;
      unreadCount.value = current.where((n) => n.unread).length;
    } catch (e) {
      debugPrint('Failed to mark notification read: $e');
    }
  }

  void markAllRead() {
    unreadCount.value = 0;
    final current = notifications.value
        .map((n) => n.copyWith(unread: false))
        .toList(growable: false);
    notifications.value = current;
  }

  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
          'chat_messages',
          'Chat Messages',
          channelDescription: 'Notifications for new chat messages',
          importance: Importance.max,
          priority: Priority.high,
          showWhen: true,
        );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(
      android: androidPlatformChannelSpecifics,
    );

    await _notificationsPlugin.show(
      id,
      title,
      body,
      platformChannelSpecifics,
      payload: payload,
    );
  }

  Future<void> sendRemote({
    required String userId,
    required String message,
    String? title,
    Map<String, dynamic>? data,
  }) async {
    if (userId.isEmpty) return;
    try {
      await ApiService.post(ApiConstants.notifications, {
        'userId': userId,
        'message': message,
        if (title != null) 'title': title,
        if (data != null) 'data': data,
      });
    } catch (e) {
      debugPrint('Failed to send remote notification: $e');
    }
  }

  String _titleFor(AppNotification notification) {
    switch (notification.type) {
      case 'reaction':
        return 'New reaction on your post';
      case 'comment':
        return 'New comment on your post';
      case 'reply':
        return 'New reply on your post';
      case 'comment-reaction':
        return 'Reaction on your post comment';
      default:
        return 'New activity';
    }
  }
}

class AppNotification {
  AppNotification({
    required this.id,
    required this.type,
    required this.postId,
    required this.message,
    this.commentId,
    this.fromUser,
    this.createdAt,
    this.unread = true,
    this.title,
  });

  final String id;
  final String type;
  final String postId;
  final String message;
  final String? commentId;
  final Map<String, dynamic>? fromUser;
  final int? createdAt;
  final bool unread;
  final String? title;

  AppNotification copyWith({bool? unread}) {
    return AppNotification(
      id: id,
      type: type,
      postId: postId,
      message: message,
      commentId: commentId,
      fromUser: fromUser,
      createdAt: createdAt,
      unread: unread ?? this.unread,
      title: title,
    );
  }

  static AppNotification fromMap(Map<String, dynamic> data) {
    final created = data['createdAt'] ?? data['created_at'];
    final payload =
        data['data'] is Map
            ? data['data'] as Map<String, dynamic>
            : <String, dynamic>{};
    final id =
        data['id']?.toString() ??
        '${DateTime.now().millisecondsSinceEpoch}-${data['postId'] ?? payload['postId'] ?? 'post'}';
    final isRead = data['isRead'] == true || data['is_read'] == true;
    final type = (data['type'] ?? payload['type'] ?? 'activity').toString();
    return AppNotification(
      id: id,
      type: type,
      postId: (data['postId'] ?? payload['postId'] ?? '').toString(),
      commentId: (data['commentId'] ?? payload['commentId'])?.toString(),
      message:
          data['message']?.toString() ??
          payload['message']?.toString() ??
          'New activity',
      fromUser:
          (data['fromUser'] as Map<String, dynamic>?) ??
          (payload['fromUser'] as Map<String, dynamic>?),
      createdAt:
          created is int
              ? created
              : (created is String
                  ? DateTime.tryParse(created)?.millisecondsSinceEpoch
                  : null),
      unread: !isRead,
      title: data['title']?.toString() ?? payload['title']?.toString(),
    );
  }
}
