import 'package:flutter/material.dart';
import '../constants/user_types.dart';

class CommonPostCard extends StatelessWidget {
  final Color surfaceColor;
  final Color borderColor;
  final Color textMainColor;
  final Color textSubColor;
  final Color primaryColor;
  final String authorName;
  final String timeAgo;
  final String authorAvatarUrl;
  final String content;
  final String? imageUrl;
  final String? tag;
  final String likesCount;
  final String commentsCount;
  final bool isCurrentUser;
  final String? userType;
  final VoidCallback? onProfileTap;

  const CommonPostCard({
    super.key,
    required this.surfaceColor,
    required this.borderColor,
    required this.textMainColor,
    required this.textSubColor,
    required this.primaryColor,
    required this.authorName,
    required this.timeAgo,
    required this.authorAvatarUrl,
    required this.content,
    this.imageUrl,
    this.tag,
    required this.likesCount,
    required this.commentsCount,
    this.isCurrentUser = false,
    this.userType,
    this.onProfileTap,
  });

  IconData _getUserTypeIcon(String? type) {
    switch (type) {
      case UserTypes.admin:
        return Icons.verified_user;
      case UserTypes.farmer:
        return Icons.agriculture;
      case UserTypes.agriculturalSpecialist:
        return Icons.psychology;
      case UserTypes.agriculturalEquipmentShop:
        return Icons.handyman;
      case UserTypes.traderVendor:
        return Icons.storefront;
      case UserTypes.livestockBreeder:
        return Icons.pets;
      case UserTypes.livestockSpecialist:
        return Icons.medical_services;
      case UserTypes.others:
      default:
        return Icons.person_outline;
    }
  }

  Color _getUserTypeColor(String? type) {
    switch (type) {
      case UserTypes.admin:
        return Colors.red;
      case UserTypes.farmer:
        return const Color(0xFF2BEE5B);
      case UserTypes.agriculturalSpecialist:
        return Colors.blue;
      case UserTypes.agriculturalEquipmentShop:
        return Colors.orange;
      case UserTypes.traderVendor:
        return Colors.purple;
      case UserTypes.livestockBreeder:
        return Colors.brown;
      case UserTypes.livestockSpecialist:
        return Colors.teal;
      case UserTypes.others:
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: onProfileTap,
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundImage: NetworkImage(authorAvatarUrl),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          authorName,
                          style: TextStyle(
                            color: textMainColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          timeAgo,
                          style: TextStyle(color: textSubColor, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (isCurrentUser)
                Icon(Icons.more_horiz, color: textSubColor)
              else
                Tooltip(
                  message: userType ?? 'User',
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: _getUserTypeColor(userType).withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _getUserTypeColor(userType).withOpacity(0.2),
                        width: 1,
                      ),
                    ),
                    child: Icon(
                      _getUserTypeIcon(userType),
                      size: 16,
                      color: _getUserTypeColor(userType),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          // if (tag != null)
          //   Container(
          //     margin: const EdgeInsets.only(bottom: 8),
          //     padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          //     decoration: BoxDecoration(
          //       color: primaryColor.withOpacity(0.2),
          //       borderRadius: BorderRadius.circular(4),
          //     ),
          //     child: Text(
          //       tag!,
          //       style: TextStyle(
          //         color: const Color(0xFF052E11),
          //         fontSize: 12,
          //         fontWeight: FontWeight.bold,
          //       ),
          //     ),
          //   ),
          Text(
            content,
            style: TextStyle(color: textMainColor, fontSize: 16, height: 1.5),
          ),
          if (imageUrl != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                imageUrl!,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Divider(color: borderColor, height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.thumb_up_outlined, size: 20, color: textSubColor),
                  const SizedBox(width: 8),
                  Text(
                    likesCount,
                    style: TextStyle(
                      color: textSubColor,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  Icon(
                    Icons.chat_bubble_outline,
                    size: 20,
                    color: textSubColor,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    commentsCount,
                    style: TextStyle(
                      color: textSubColor,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
