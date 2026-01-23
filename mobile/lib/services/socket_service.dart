import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../constants/api_constants.dart';
import '../models/user.dart';
import 'notification_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  IO.Socket? _socket;
  bool _isConnected = false;
  static String? activeConversationId; // Track current active chat room

  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  bool get isConnected => _isConnected;
  IO.Socket? get socket => _socket;

  void on(String event, Function(dynamic data) handler) {
    _socket?.on(event, handler);
  }

  void off(String event, Function(dynamic data) handler) {
    _socket?.off(event, handler);
  }

  void subscribe(String room) {
    _socket?.emit('subscribe', room);
  }

  void unsubscribe(String room) {
    _socket?.emit('unsubscribe', room);
  }

  void connect(String token, User user) {
    if (_socket != null && _socket!.connected) return;

    // Remove /api from the end of baseUrl to get the root URL
    final socketUrl = ApiConstants.baseUrl.replaceAll('/api', '');

    _socket = IO.io(
      socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({
            'token': token,
            'userId': user.id,
            'userEmail': user.email,
            'userName': user.name,
            'userUsername': user.name, // Using name as username fallback
            'userType': user.userType,
          })
          .enableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      print('Socket connected');
      _isConnected = true;

      _socket!.emit('authenticate', {
        'id': user.id,
        'name': user.name,
        'username': user.name,
        'profilePicture': user.profilePicture ?? "",
      });

      _socket!.emit('get-online-users');

      _bindNotificationChannel();
    });

    _socket!.onDisconnect((_) {
      print('Socket disconnected');
      _isConnected = false;
    });

    _socket!.onConnectError((data) {
      print('Socket connection error: $data');
      _isConnected = false;
    });

    _socket!.connect();
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.off('notify:post');
      _socket!.disconnect();
      _socket = null;
      _isConnected = false;
    }
  }

  void _bindNotificationChannel() {
    _socket?.off('notify:post');
    _socket?.on('notify:post', (data) {
      if (data is Map<String, dynamic>) {
        NotificationService().handleIncomingRemote(data);
      } else if (data is Map) {
        NotificationService().handleIncomingRemote(
          Map<String, dynamic>.from(data),
        );
      }
    });
  }

  void joinConversation(String conversationId) {
    activeConversationId = conversationId;
    _socket?.emit('chat:join', conversationId);
  }

  void leaveConversation(String conversationId) {
    if (activeConversationId == conversationId) {
      activeConversationId = null;
    }
    _socket?.emit('chat:leave', conversationId);
  }

  void onNewMessage(Function(dynamic) callback) {
    _socket?.on('message:new', callback);
  }

  void offNewMessage(Function(dynamic) callback) {
    _socket?.off('message:new', callback);
  }
}
