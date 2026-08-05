import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';

class CommonBottomNav extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onTap;

  const CommonBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Colors
    const primaryColor = Color(0xFF2BEE5B);
    final surfaceColor =
        isDark ? const Color(0xFF1A2C1E) : const Color(0xFFFFFFFF);
    final textSubColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);
    final borderColor =
        isDark ? Colors.white.withOpacity(0.1) : const Color(0xFFE5E7EB);

    return Container(
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(top: BorderSide(color: borderColor)),
      ),
      padding: const EdgeInsets.only(
        top: 12,
        bottom: 24, // Safe area padding
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(
            Icons.home,
            Icons.home_outlined,
            AppLocalizations.of(context)!.navHome,
            0,
            primaryColor,
            textSubColor,
          ),
          _buildNavItem(
            Icons.category,
            Icons.category_outlined,
            AppLocalizations.of(context)!.navCategory,
            1,
            primaryColor,
            textSubColor,
          ),
          _buildNavItem(
            Icons.chat_bubble,
            Icons.chat_bubble_outline,
            AppLocalizations.of(context)!.navChatting,
            2,
            primaryColor,
            textSubColor,
          ),
          _buildNavItem(
            Icons.settings,
            Icons.settings_outlined,
            AppLocalizations.of(context)!.navSetting,
            3,
            primaryColor,
            textSubColor,
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(
    IconData selectedIcon,
    IconData unselectedIcon,
    String label,
    int index,
    Color selectedColor,
    Color unselectedColor,
  ) {
    final isSelected = selectedIndex == index;
    return GestureDetector(
      onTap: () => onTap(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSelected ? selectedIcon : unselectedIcon,
            color: isSelected ? selectedColor : unselectedColor,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? selectedColor : unselectedColor,
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
