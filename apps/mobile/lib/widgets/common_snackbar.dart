import 'package:flutter/material.dart';

enum SnackBarPosition { top, middle, bottom }

enum SnackBarType { info, warning, error }

class CommonSnackbar {
  static void show(
    BuildContext context, {
    required SnackBarPosition position,
    required SnackBarType type,
    required String message,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    Color backgroundColor;
    Color textColor;
    IconData icon;

    switch (type) {
      case SnackBarType.info:
        backgroundColor =
            isDark ? const Color(0xFF0D47A1) : const Color(0xFFE3F2FD);
        textColor = isDark ? Colors.white : const Color(0xFF0D47A1);
        icon = Icons.info_outline;
        break;
      case SnackBarType.warning:
        backgroundColor =
            isDark ? const Color(0xFFE65100) : const Color(0xFFFFF3E0);
        textColor = isDark ? Colors.white : const Color(0xFFE65100);
        icon = Icons.warning_amber_rounded;
        break;
      case SnackBarType.error:
        backgroundColor =
            isDark ? const Color(0xFFB71C1C) : const Color(0xFFFFEBEE);
        textColor = isDark ? Colors.white : const Color(0xFFB71C1C);
        icon = Icons.cancel_outlined;
        break;
    }

    final mediaQuery = MediaQuery.of(context);
    final screenHeight = mediaQuery.size.height;

    EdgeInsets margin;

    // Positioning logic using SnackBar behavior: floating and margins
    switch (position) {
      case SnackBarPosition.top:
        // Pushing from bottom to top.
        // 100 is an arbitrary offset for typical AppBar height + status bar + safe area
        margin = EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: screenHeight - 140,
        );
        break;
      case SnackBarPosition.middle:
        margin = EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: screenHeight / 2 - 40,
        );
        break;
      case SnackBarPosition.bottom:
        margin = const EdgeInsets.all(16);
        break;
    }

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.transparent,
        elevation: 0,
        margin: margin,
        duration: const Duration(milliseconds: 2000),
        content: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
            border: Border.all(color: textColor.withOpacity(0.1), width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: textColor, size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
