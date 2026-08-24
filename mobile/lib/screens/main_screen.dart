import 'package:flutter/material.dart';
import '../widgets/common_bottom_nav.dart';
import 'home_screen.dart';
import 'ai_chat_screen.dart';
import 'category_navigator.dart';
import 'chatting_screen.dart';
import 'settings_screen.dart';
import '../services/socket_service.dart';
import '../services/notification_service.dart';
import '../models/chat_models.dart';
import '../services/auth_service.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;
  final SocketService _socketService = SocketService();
  final NotificationService _notificationService = NotificationService();

  List<Widget> _screens = [];

  @override
  void initState() {
    super.initState();
    if (AuthService.currentUser == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pushReplacementNamed(context, '/login');
      });
      return;
    }
    _notificationService.init();
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    _socketService.onNewMessage((data) {
      if (!mounted) return;

      try {
        final message = Message.fromJson(data);

        // Only show notification if user is not in the active conversation
        if (SocketService.activeConversationId != message.conversationId) {
          _notificationService.showNotification(
            id: message.hashCode,
            title: message.user?.name ?? "New Message",
            body:
                message.content ??
                (message.type == MessageType.IMAGE ? "Image" :
                 (message.type == MessageType.VIDEO ? "Video" : "File")),
            payload: message.conversationId,
          );
        }
      } catch (e) {
        // Silently ignore parsing errors
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _screens = [
      const HomeScreen(),
      const AiChatScreen(),
      const CategoryNavigator(),
      const ChattingScreen(),
      const SettingsScreen(),
    ];
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Column(
              children: [
                Expanded(
                  child: IndexedStack(
                    index: _selectedIndex,
                    children: _screens,
                  ),
                ),
              ],
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: CommonBottomNav(
                selectedIndex: _selectedIndex,
                onTap: _onItemTapped,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
