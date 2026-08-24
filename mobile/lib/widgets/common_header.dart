import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../screens/notification_screen.dart';
import '../services/notification_service.dart';

class CommonHeader extends StatelessWidget {
  const CommonHeader({
    super.key,
    this.hasUnread = false,
    this.onNotificationTap,
  });

  final bool hasUnread;
  final VoidCallback? onNotificationTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Colors
    const primaryColor = Color(0xFF2BEE5B);
    final backgroundColor = isDark ? const Color(0xFF102215) : Colors.white;
    final textMainColor =
        isDark ? const Color(0xFFFFFFFF) : const Color(0xFF111813);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: backgroundColor.withOpacity(0.95),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(7),
                  child: Image.asset('assets/logo.png', fit: BoxFit.contain),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                AppLocalizations.of(context)!.appTitle,
                style: TextStyle(
                  color: textMainColor,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          ValueListenableBuilder<int>(
            valueListenable: NotificationService().unreadCount,
            builder: (context, count, _) {
              final showDot = hasUnread || count > 0;
              final controlBg =
                  isDark ? Colors.white.withOpacity(0.06) : Colors.grey[100];

              return GestureDetector(
                onTap:
                    onNotificationTap ??
                    () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const NotificationScreen(),
                        ),
                      );
                    },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: controlBg,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (showDot) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color:
                                  isDark
                                      ? const Color(0xFF102215)
                                      : Colors.white,
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Text(
                            count > 99 ? '99+' : count.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color:
                              isDark
                                  ? Colors.white.withOpacity(0.1)
                                  : Colors.grey[100],
                        ),
                        child: Icon(
                          showDot
                              ? Icons.notifications
                              : Icons.notifications_outlined,
                          color: textMainColor,
                          size: 22,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
