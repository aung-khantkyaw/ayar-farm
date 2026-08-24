import 'package:flutter/material.dart';
import '../services/notification_service.dart';
import '../services/auth_service.dart';
import '../screens/post_screen.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final userId = AuthService.currentUser?.id ?? '';
      await NotificationService().fetchForUser(userId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final backgroundColor =
        isDark ? const Color(0xFF0F1C14) : const Color(0xFFF6F8F6);
    final cardColor = isDark ? const Color(0xFF1A2C1E) : Colors.white;
    final textMainColor = isDark ? Colors.white : const Color(0xFF111813);
    final textSubColor =
        isDark ? const Color(0xFF9AB3A2) : const Color(0xFF5D7464);
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: backgroundColor,
        elevation: 0,
        iconTheme: IconThemeData(color: textMainColor),
        title: Text(
          'Notifications',
          style: TextStyle(
            color: textMainColor,
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          final userId = AuthService.currentUser?.id ?? '';
          await NotificationService().fetchForUser(userId);
        },
        child: ValueListenableBuilder<List<AppNotification>>(
          valueListenable: NotificationService().notifications,
          builder: (context, items, _) {
            if (items.isEmpty) {
              return Center(
                child: Text(
                  'No notifications yet',
                  style: TextStyle(color: textSubColor),
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 24),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 2),
              itemBuilder: (context, index) {
                final item = items[index];
                final typeColor = _colorFor(item.type);
                return Material(
                  color:
                      item.unread
                          ? (isDark
                              ? const Color(0xFF233C2A)
                              : const Color(0xFFEAF6ED))
                          : cardColor,
                  borderRadius: BorderRadius.circular(12),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () async {
                      await NotificationService().markAsRead(item.id);
                      if (!mounted) return;
                      if (item.postId.isNotEmpty) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PostScreen(postId: item.postId),
                          ),
                        );
                      }
                    },
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 12, 10, 12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              _SenderAvatar(
                                url: item.fromUser?['avatar'],
                                fallbackColor:
                                    isDark
                                        ? Colors.white.withOpacity(0.08)
                                        : const Color(0xFFECF7EF),
                                name: item.fromUser?['name']?.toString(),
                              ),
                              Positioned(
                                right: -2,
                                bottom: -2,
                                child: Container(
                                  width: 24,
                                  height: 24,
                                  decoration: BoxDecoration(
                                    color: typeColor,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: cardColor,
                                      width: 2,
                                    ),
                                  ),
                                  child: Icon(
                                    _iconFor(item.type),
                                    color: Colors.white,
                                    size: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.message,
                                  style: TextStyle(
                                    color: textMainColor,
                                    fontSize: 14,
                                    height: 1.3,
                                    fontWeight:
                                        item.unread
                                            ? FontWeight.w700
                                            : FontWeight.w400,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  item.createdAt != null
                                      ? _timeAgo(item.createdAt!)
                                      : _subtitleFor(item),
                                  style: TextStyle(
                                    color:
                                        item.unread ? typeColor : textSubColor,
                                    fontSize: 12,
                                    fontWeight:
                                        item.unread
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (item.unread)
                            Padding(
                              padding: const EdgeInsets.only(top: 22, left: 8),
                              child: Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF2BEE5B),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  String _subtitleFor(AppNotification item) {
    switch (item.type) {
      case 'reaction':
        return 'Reaction on your post';
      case 'comment':
        return 'Comment on your post';
      case 'reply':
        return 'Reply on your post';
      case 'comment-reaction':
        return 'Reaction on a comment of your post';
      case 'announcement':
        return 'New announcement';
      default:
        return 'New activity';
    }
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'reaction':
      case 'comment-reaction':
        return Icons.thumb_up;
      case 'comment':
      case 'reply':
        return Icons.comment;
      case 'announcement':
        return Icons.campaign;
      default:
        return Icons.notifications;
    }
  }

  Color _colorFor(String type) {
    switch (type) {
      case 'reaction':
      case 'comment-reaction':
        return const Color(0xFF2BEE5B);
      case 'comment':
      case 'reply':
        return const Color(0xFF3B82F6);
      case 'announcement':
        return const Color(0xFFF59E0B);
      default:
        return const Color(0xFF6B7280);
    }
  }

  String _timeAgo(int timestampMs) {
    final now = DateTime.now();
    final time = DateTime.fromMillisecondsSinceEpoch(timestampMs);
    final diff = now.difference(time);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}

class _SenderAvatar extends StatelessWidget {
  const _SenderAvatar({
    required this.url,
    required this.fallbackColor,
    this.name,
  });

  final String? url;
  final Color fallbackColor;
  final String? name;

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.isNotEmpty) {
      return CircleAvatar(radius: 22, backgroundImage: NetworkImage(url!));
    }

    final initials =
        (name?.isNotEmpty ?? false) ? name!.trim()[0].toUpperCase() : '✱';
    return CircleAvatar(
      radius: 22,
      backgroundColor: fallbackColor,
      child: Text(
        initials,
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
    );
  }
}
