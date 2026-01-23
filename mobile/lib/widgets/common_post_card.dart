import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../constants/user_types.dart';
import '../screens/post_screen.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';
import '../services/post_service.dart';
import '../models/post.dart';
import '../screens/create_post_screen.dart';
import 'package:ayar_farm/widgets/common_snackbar.dart';

class CommonPostCard extends StatefulWidget {
  final Color surfaceColor;
  final Color borderColor;
  final Color textMainColor;
  final Color textSubColor;
  final Color primaryColor;
  final String authorId;
  final String authorName;
  final String timeAgo;
  final String authorAvatarUrl;
  final String content;
  final List<String>? images;
  final String postId;
  final String? tag;
  final String likesCount;
  final String commentsCount;
  final bool isCurrentUser;
  final String? userType;
  final VoidCallback? onProfileTap;
  final VoidCallback? onDeleted;
  final bool reacted;
  final String? reactionType;

  const CommonPostCard({
    super.key,
    required this.surfaceColor,
    required this.borderColor,
    required this.textMainColor,
    required this.textSubColor,
    required this.primaryColor,
    required this.authorId,
    required this.authorName,
    required this.timeAgo,
    required this.authorAvatarUrl,
    required this.content,
    this.images,
    required this.postId,
    this.tag,
    required this.likesCount,
    required this.commentsCount,
    this.isCurrentUser = false,
    this.userType,
    this.onProfileTap,
    this.onDeleted,
    this.reacted = false,
    this.reactionType,
  });

  @override
  State<CommonPostCard> createState() => _CommonPostCardState();
}

class _CommonPostCardState extends State<CommonPostCard> {
  late bool _reacted;
  late int _likes;
  late int _comments;
  String? _reactionType;
  late String _content;

  @override
  void initState() {
    super.initState();
    _reacted = widget.reacted;
    _likes = int.tryParse(widget.likesCount) ?? 0;
    _comments = int.tryParse(widget.commentsCount) ?? 0;
    _reactionType = widget.reactionType;
    _content = widget.content;
  }

  @override
  void didUpdateWidget(covariant CommonPostCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Keep state in sync if the parent provides new reaction info (e.g., on refresh)
    if (oldWidget.reacted != widget.reacted ||
        oldWidget.reactionType != widget.reactionType ||
        oldWidget.likesCount != widget.likesCount ||
        oldWidget.commentsCount != widget.commentsCount ||
        oldWidget.content != widget.content) {
      setState(() {
        _reacted = widget.reacted;
        _reactionType = widget.reactionType;
        _likes = int.tryParse(widget.likesCount) ?? _likes;
        _comments = int.tryParse(widget.commentsCount) ?? _comments;
        _content = widget.content;
      });
    }
  }

  Future<void> _editPost() async {
    Post? full;
    try {
      full = await PostService.getPost(widget.postId);
    } catch (_) {}
    final post = full;
    if (post == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to load post for editing')),
        );
      }
      return;
    }

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder:
            (_) => CreatePostScreen(
              postId: post.id,
              initialContent: post.content ?? '',
              initialTags: post.tags,
              initialMedia: post.media,
              initialVisibility: null,
            ),
      ),
    );

    if (!mounted) return;
    if (result is Post) {
      setState(() {
        _content = result.content ?? _content;
        _comments = result.counts.comments;
        _likes = result.counts.reactions;
      });
    } else if (result == true) {
      // Fallback: refresh post after generic success flag.
      final refreshed = await PostService.getPost(widget.postId);
      if (refreshed != null && mounted) {
        setState(() {
          _content = refreshed.content ?? _content;
          _comments = refreshed.counts.comments;
          _likes = refreshed.counts.reactions;
        });
      }
    }
  }

  Future<void> _deletePost() async {
    final l10n = AppLocalizations.of(context);
    final confirm = await showDialog<bool>(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: Text(l10n?.deletePost ?? 'Delete post?'),
            content: Text(
              l10n?.deletePostBody ?? 'This will permanently remove your post.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text(l10n?.commonCancel ?? 'Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(l10n?.delete ?? 'Delete'),
              ),
            ],
          ),
    );
    if (confirm != true) return;
    try {
      await ApiService.delete('${ApiConstants.posts}/${widget.postId}');
      if (!mounted) return;
      widget.onDeleted?.call();
      CommonSnackbar.show(
        context,
        message: 'Post deleted successfully',
        position: SnackBarPosition.bottom,
        type: SnackBarType.info,
      );
    } catch (_) {
      if (!mounted) return;
      CommonSnackbar.show(
        context,
        message:
            'l10n?.postDeletedError ?? '
            'Failed to delete post',
        position: SnackBarPosition.bottom,
        type: SnackBarType.error,
      );
    }
  }

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

  void _showReactionPicker() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _reactionOption('LIKE', Icons.thumb_up, 'Like'),
              _reactionOption('UNLIKE', Icons.thumb_down, 'Unlike'),
              _reactionOption('SUPPORT', Icons.volunteer_activism, 'Support'),
              _reactionOption('CARE', Icons.favorite, 'Care'),
              if (_reactionType != null)
                ListTile(
                  leading: const Icon(Icons.close),
                  title: const Text('Remove reaction'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _setReaction(null);
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _reactionOption(String type, IconData icon, String label) {
    final isActive = _reactionType == type;
    return ListTile(
      leading: Icon(icon, color: isActive ? widget.primaryColor : null),
      title: Text(label),
      trailing: isActive ? Icon(Icons.check, color: widget.primaryColor) : null,
      onTap: () {
        Navigator.pop(context);
        _setReaction(type);
      },
    );
  }

  Future<void> _sendReactionNotification(String reactionType) async {
    final actor = AuthService.currentUser;
    if (actor == null) return;
    if (widget.authorId == actor.id) return;

    final message = '${actor.name ?? 'Someone'} reacted to your post.';
    await NotificationService().sendRemote(
      userId: widget.authorId,
      message: message,
      data: {
        'type': 'reaction',
        'postId': widget.postId,
        'reactionType': reactionType,
      },
    );
  }

  Future<void> _setReaction(String? newType) async {
    final hadReaction = _reactionType != null;
    try {
      if (newType == null) {
        if (!hadReaction) return;
        await ApiService.delete('${ApiConstants.posts}/${widget.postId}/react');
        setState(() {
          _reactionType = null;
          _reacted = false;
          _likes = (_likes - 1).clamp(0, 1 << 30);
        });
        return;
      }

      if (hadReaction && _reactionType == newType) {
        await ApiService.delete('${ApiConstants.posts}/${widget.postId}/react');
        setState(() {
          _reactionType = null;
          _reacted = false;
          _likes = (_likes - 1).clamp(0, 1 << 30);
        });
        return;
      }

      // Switch or add reaction
      await ApiService.post('${ApiConstants.posts}/${widget.postId}/react', {
        'type': newType,
      });

      setState(() {
        // If it was a new reaction, increment count; if switching types, keep count the same
        if (!hadReaction) {
          _likes = _likes + 1;
        }
        _reactionType = newType;
        _reacted = true;
      });

      await _sendReactionNotification(newType);
    } catch (_) {
      // silently fail for now; could show a snack bar if context available
    }
  }

  IconData _currentReactionIcon() {
    switch (_reactionType) {
      case 'UNLIKE':
        return Icons.thumb_down;
      case 'SUPPORT':
        return Icons.volunteer_activism;
      case 'CARE':
        return Icons.favorite;
      case 'LIKE':
      default:
        return _reacted ? Icons.thumb_up : Icons.thumb_up_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: widget.surfaceColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: widget.borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: widget.onProfileTap,
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundImage: NetworkImage(widget.authorAvatarUrl),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.authorName,
                          style: TextStyle(
                            color: widget.textMainColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        Text(
                          widget.timeAgo,
                          style: TextStyle(
                            color: widget.textSubColor,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (widget.isCurrentUser)
                PopupMenuButton<String>(
                  icon: Icon(Icons.more_horiz, color: widget.textSubColor),
                  onSelected: (value) {
                    if (value == 'edit') _editPost();
                    if (value == 'delete') _deletePost();
                  },
                  itemBuilder:
                      (ctx) => [
                        PopupMenuItem(
                          value: 'edit',
                          child: Text(
                            AppLocalizations.of(context)?.postEdit ??
                                'Edit post',
                          ),
                        ),
                        PopupMenuItem(
                          value: 'delete',
                          child: Text(
                            AppLocalizations.of(context)?.postDelete ??
                                'Delete post',
                          ),
                        ),
                      ],
                )
              else
                Tooltip(
                  message: widget.userType ?? 'User',
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: _getUserTypeColor(
                        widget.userType,
                      ).withOpacity(0.1),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _getUserTypeColor(
                          widget.userType,
                        ).withOpacity(0.2),
                        width: 1,
                      ),
                    ),
                    child: Icon(
                      _getUserTypeIcon(widget.userType),
                      size: 16,
                      color: _getUserTypeColor(widget.userType),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PostScreen(postId: widget.postId),
                ),
              );
              if (mounted && result is int) {
                setState(() {
                  _comments = result;
                });
              }
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                  _truncateWords(_content, 100),
                  style: TextStyle(
                    color: widget.textMainColor,
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
                if (widget.images != null && widget.images!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  if (widget.images!.length == 1)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        widget.images!.first,
                        width: double.infinity,
                        height: 200,
                        fit: BoxFit.cover,
                      ),
                    )
                  else
                    GridView.count(
                      shrinkWrap: true,
                      crossAxisCount: 2,
                      crossAxisSpacing: 6,
                      mainAxisSpacing: 6,
                      physics: const NeverScrollableScrollPhysics(),
                      children:
                          widget.images!.map((img) {
                            return ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(img, fit: BoxFit.cover),
                            );
                          }).toList(),
                    ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 12),
          Divider(color: widget.borderColor, height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: _showReactionPicker,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: widget.surfaceColor,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: widget.borderColor.withOpacity(0.5),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          _currentReactionIcon(),
                          size: 20,
                          color:
                              _reacted
                                  ? widget.primaryColor
                                  : widget.textSubColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _likes.toString(),
                          style: TextStyle(
                            color:
                                _reacted
                                    ? widget.primaryColor
                                    : widget.textSubColor,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PostScreen(postId: widget.postId),
                      ),
                    );
                    if (mounted && result is int) {
                      setState(() {
                        _comments = result;
                      });
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: widget.primaryColor.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: widget.primaryColor.withOpacity(0.2),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.chat_bubble_outline,
                          size: 20,
                          color: widget.primaryColor,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _comments.toString(),
                          style: TextStyle(
                            color: widget.primaryColor,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _truncateWords(String text, int maxWords) {
    final words = text.split(RegExp(r'\s+'));
    if (words.length <= maxWords) return text;
    return words.sublist(0, maxWords).join(' ') + '...';
  }
}
