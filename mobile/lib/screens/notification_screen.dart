import 'package:ayar_farm/l10n/app_localizations.dart';
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
    final borderColor =
        isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE5E7EB);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: backgroundColor,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: textMainColor),
        title: Text(
          AppLocalizations.of(context)?.appTitle ?? 'Notifications',
          style: TextStyle(color: textMainColor, fontWeight: FontWeight.w700),
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
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = items[index];
                return Container(
                  decoration: BoxDecoration(
                    color: cardColor,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: borderColor),
                    boxShadow: [
                      if (!isDark)
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                    ],
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    leading: Stack(
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
                        if (item.unread)
                          Positioned(
                            top: -2,
                            right: -2,
                            child: Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color:
                                      isDark
                                          ? const Color(0xFF0F1C14)
                                          : Colors.white,
                                  width: 2,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    title: Text(
                      item.message,
                      style: TextStyle(
                        color: textMainColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          _subtitleFor(item),
                          style: TextStyle(color: textSubColor),
                        ),
                        if (item.createdAt != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            _timeAgo(item.createdAt!),
                            style: TextStyle(
                              color: textSubColor.withOpacity(0.8),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),
                    trailing: Icon(Icons.chevron_right, color: textSubColor),
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
      default:
        return 'New activity';
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
