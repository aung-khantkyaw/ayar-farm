import 'package:flutter/material.dart';

enum AnnouncementType { information, warning, breakingNews }

class AnnouncementCard extends StatelessWidget {
  final String title;
  final String message;
  final AnnouncementType type;
  final VoidCallback? onClose;

  const AnnouncementCard({
    super.key,
    required this.title,
    required this.message,
    required this.type,
    this.onClose,
  });

  Color get _bgColor {
    switch (type) {
      case AnnouncementType.warning:
        return Colors.amber.shade100;
      case AnnouncementType.breakingNews:
        return Colors.red.shade100;
      case AnnouncementType.information:
      default:
        return Colors.blue.shade50;
    }
  }

  Color get _iconColor {
    switch (type) {
      case AnnouncementType.warning:
        return Colors.amber.shade800;
      case AnnouncementType.breakingNews:
        return Colors.red.shade700;
      case AnnouncementType.information:
      default:
        return Colors.blue.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _iconColor.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: _iconColor.withOpacity(0.08),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: _iconColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 2),
                Text(message, style: const TextStyle(fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
