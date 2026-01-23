import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../services/auth_service.dart';

class PostScreen extends StatefulWidget {
  final String postId;

  const PostScreen({super.key, required this.postId});

  @override
  State<PostScreen> createState() => _PostScreenState();
}

class _PostScreenState extends State<PostScreen> {
  Map<String, dynamic>? post;
  bool loading = true;
  final TextEditingController _commentController = TextEditingController();
  bool _reacted = false;
  String? _reactionType;
  int _likes = 0;
  int _commentsCount = 0;
  String? _replyToCommentId;
  String? _replyToName;

  // ApiService uses ApiConstants.baseUrl; ensure environment is configured for your dev host

  @override
  void initState() {
    super.initState();
    _loadPost();
  }

  Future<void> _loadPost() async {
    setState(() {
      loading = true;
    });

    try {
      final res = await ApiService.get(
        '${ApiConstants.posts}/${widget.postId}',
      );
      final data = res['data'] ?? res;
      if (!mounted) return;
      final reactions = (data['reactions'] as List?) ?? [];
      final counts = (data['_count'] ?? {}) as Map;
      final currentUserId = AuthService.currentUser?.id?.toString();
      String? reactionType;
      bool reacted = false;

      if (currentUserId != null) {
        reacted = reactions.any((r) {
          if (r is Map) {
            final userId = r['userId'] ?? r['user_id'] ?? r['user']?['id'];
            if (userId != null && userId.toString() == currentUserId) {
              reactionType = r['type']?.toString();
              return true;
            }
          }
          return false;
        });
      }

      setState(() {
        post = data as Map<String, dynamic>;
        _reacted = reacted;
        _reactionType = reactionType;
        _likes = _asInt(counts['reactions']) ?? reactions.length;
        _commentsCount =
            _asInt(counts['comments']) ??
            (data['comments'] as List?)?.length ??
            0;
        loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  int? _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 365) return '${(diff.inDays / 365).floor()}y ago';
    if (diff.inDays > 30) return '${(diff.inDays / 30).floor()}mo ago';
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }

  Color get _textSubColorTheme {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);
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
      leading: Icon(icon, color: isActive ? const Color(0xFF2BEE5B) : null),
      title: Text(label),
      trailing:
          isActive ? const Icon(Icons.check, color: Color(0xFF2BEE5B)) : null,
      onTap: () {
        Navigator.pop(context);
        _setReaction(type);
      },
    );
  }

  String _commentTimeLabel(Map c) {
    final raw = c['createdAt'] ?? c['created_at'];
    if (raw is String) {
      final dt = DateTime.tryParse(raw);
      if (dt != null) return _timeAgo(dt);
    }
    if (raw is DateTime) return _timeAgo(raw);
    return '';
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

      await ApiService.post('${ApiConstants.posts}/${widget.postId}/react', {
        'type': newType,
      });

      setState(() {
        if (!hadReaction) {
          _likes = _likes + 1;
        }
        _reactionType = newType;
        _reacted = true;
      });
    } catch (_) {
      // no-op; could surface a snackbar if desired
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

  Widget _buildCommentItem(Map<String, dynamic> c, {bool isReply = false}) {
    final author = c['author'] ?? {};
    final name = author['name']?.toString() ?? 'Unknown';
    final profile = author['profile_picture'] ?? author['profilePicture'];
    final reactionType = _commentReactionType(c);
    final reacted = reactionType != null;
    final reactionCount = _commentReactionCount(c);
    final replies = (c['replies'] ?? []) as List<dynamic>;

    return Padding(
      padding: EdgeInsets.fromLTRB(isReply ? 32 : 0, 8, 0, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage: profile != null ? NetworkImage(profile) : null,
                child:
                    profile == null
                        ? Text(
                          name.isNotEmpty ? name[0].toUpperCase() : '?',
                          style: const TextStyle(fontSize: 12),
                        )
                        : null,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _commentTimeLabel(c),
                          style: TextStyle(
                            color: _textSubColorTheme,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(c['content'] ?? ''),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        InkWell(
                          borderRadius: BorderRadius.circular(6),
                          onTap: () => _showCommentReactionPicker(c),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                _commentReactionIcon(reactionType),
                                size: 16,
                                color:
                                    reacted
                                        ? const Color(0xFF2BEE5B)
                                        : _textSubColorTheme,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                reactionCount.toString(),
                                style: TextStyle(
                                  color:
                                      reacted
                                          ? const Color(0xFF2BEE5B)
                                          : _textSubColorTheme,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _replyToCommentId = c['id']?.toString();
                              _replyToName = name;
                            });
                          },
                          child: const Text(
                            'Reply',
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (replies.isNotEmpty)
            ...replies
                .map(
                  (r) => _buildCommentItem(
                    r as Map<String, dynamic>,
                    isReply: true,
                  ),
                )
                .toList(),
        ],
      ),
    );
  }

  void _showCommentReactionPicker(Map<String, dynamic> c) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _commentReactionOption(c, 'LIKE', Icons.thumb_up, 'Like'),
              _commentReactionOption(c, 'UNLIKE', Icons.thumb_down, 'Unlike'),
              _commentReactionOption(
                c,
                'SUPPORT',
                Icons.volunteer_activism,
                'Support',
              ),
              _commentReactionOption(c, 'CARE', Icons.favorite, 'Care'),
              if (_commentReactionType(c) != null)
                ListTile(
                  leading: const Icon(Icons.close),
                  title: const Text('Remove reaction'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _setCommentReaction(c, null);
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _commentReactionOption(
    Map<String, dynamic> c,
    String type,
    IconData icon,
    String label,
  ) {
    final isActive = _commentReactionType(c) == type;
    return ListTile(
      leading: Icon(icon, color: isActive ? const Color(0xFF2BEE5B) : null),
      title: Text(label),
      trailing:
          isActive ? const Icon(Icons.check, color: Color(0xFF2BEE5B)) : null,
      onTap: () {
        Navigator.pop(context);
        _setCommentReaction(c, type);
      },
    );
  }

  Future<void> _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;
    try {
      final res = await ApiService.post(
        '${ApiConstants.posts}/${widget.postId}/comments',
        {
          'content': text,
          if (_replyToCommentId != null) 'parentCommentId': _replyToCommentId,
        },
      );
      final newComment = res['data'] ?? res;
      setState(() {
        post ??= {};
        if (_replyToCommentId != null) {
          final target = _findComment(_replyToCommentId!);
          if (target != null) {
            final replies = (target['replies'] ?? []) as List;
            replies.add(newComment);
            target['replies'] = replies;
          }
        } else {
          final comments = (post!['comments'] ?? []) as List<dynamic>;
          comments.add(newComment);
          post!['comments'] = comments;
        }
        _commentsCount = _commentsCount + 1;
        _replyToCommentId = null;
        _replyToName = null;
      });
      _commentController.clear();
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Error posting comment')));
    }
  }

  Map<String, dynamic>? _findComment(String id) {
    final comments = (post?['comments'] ?? []) as List<dynamic>;
    for (final c in comments) {
      if (c['id'] == id) return c as Map<String, dynamic>;
      final replies = (c['replies'] ?? []) as List<dynamic>;
      for (final r in replies) {
        if (r['id'] == id) return r as Map<String, dynamic>;
      }
    }
    return null;
  }

  String? _commentReactionType(Map c) {
    final reactions = (c['reactions'] as List?) ?? [];
    final currentUserId = AuthService.currentUser?.id;
    if (currentUserId == null) return null;
    for (final r in reactions) {
      if (r is Map) {
        final userId = r['userId'] ?? r['user_id'] ?? r['user']?['id'];
        if (userId != null && userId.toString() == currentUserId) {
          return r['type']?.toString();
        }
      }
    }
    return null;
  }

  int _commentReactionCount(Map c) {
    final count = _asInt((c['_count'] ?? {})['reactions']);
    if (count != null) return count;
    final reactions = (c['reactions'] as List?) ?? [];
    return reactions.length;
  }

  IconData _commentReactionIcon(String? type) {
    switch (type) {
      case 'UNLIKE':
        return Icons.thumb_down;
      case 'SUPPORT':
        return Icons.volunteer_activism;
      case 'CARE':
        return Icons.favorite;
      case 'LIKE':
      default:
        return Icons.thumb_up_outlined;
    }
  }

  Future<void> _setCommentReaction(Map c, String? newType) async {
    final commentId = c['id']?.toString();
    if (commentId == null) return;

    final current = _commentReactionType(c);
    final hadReaction = current != null;

    try {
      if (newType == null) {
        if (!hadReaction) return;
        await ApiService.delete(
          '${ApiConstants.posts}/${widget.postId}/comments/$commentId/react',
        );
        setState(() {
          final reactions = (c['reactions'] as List?) ?? [];
          reactions.removeWhere((r) {
            if (r is Map) {
              final userId = r['userId'] ?? r['user_id'] ?? r['user']?['id'];
              return userId?.toString() == AuthService.currentUser?.id;
            }
            return false;
          });
          c['reactions'] = reactions;
          final cnt = _commentReactionCount(c) - 1;
          c['_count'] = {
            ...(c['_count'] ?? {}),
            'reactions': cnt.clamp(0, 1 << 30),
          };
        });
        return;
      }

      if (hadReaction && current == newType) {
        await ApiService.delete(
          '${ApiConstants.posts}/${widget.postId}/comments/$commentId/react',
        );
        setState(() {
          final reactions = (c['reactions'] as List?) ?? [];
          reactions.removeWhere((r) {
            if (r is Map) {
              final userId = r['userId'] ?? r['user_id'] ?? r['user']?['id'];
              return userId?.toString() == AuthService.currentUser?.id;
            }
            return false;
          });
          c['reactions'] = reactions;
          final cnt = _commentReactionCount(c) - 1;
          c['_count'] = {
            ...(c['_count'] ?? {}),
            'reactions': cnt.clamp(0, 1 << 30),
          };
        });
        return;
      }

      await ApiService.post(
        '${ApiConstants.posts}/${widget.postId}/comments/$commentId/react',
        {'type': newType},
      );

      setState(() {
        final reactions =
            List<Map<String, dynamic>>.from((c['reactions'] ?? []) as List)
              ..removeWhere((r) {
                final userId =
                    (r['userId'] ?? r['user_id'] ?? r['user']?['id'])
                        ?.toString();
                return userId == AuthService.currentUser?.id;
              })
              ..add({'userId': AuthService.currentUser?.id, 'type': newType});
        c['reactions'] = reactions;
        if (!hadReaction) {
          final cnt = _commentReactionCount(c) + 1;
          c['_count'] = {...(c['_count'] ?? {}), 'reactions': cnt};
        }
      });
    } catch (_) {
      // optionally show error
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context);

    // Colors from HTML design
    const primaryColor = Color(0xFF2BEE5B);
    final surfaceColor =
        isDark ? const Color(0xFF1A2C1E) : const Color(0xFFFFFFFF);
    final textMainColor =
        isDark ? const Color(0xFFFFFFFF) : const Color(0xFF111813);
    final textSubColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);

    return WillPopScope(
      onWillPop: () async {
        Navigator.pop(context, _commentsCount);
        return false;
      },
      child: Scaffold(
        backgroundColor: backgroundColor,
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(64),
          child: SafeArea(
            bottom: false,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: surfaceColor.withOpacity(0.95),
              child: Row(
                children: [
                  InkWell(
                    onTap: () => Navigator.pop(context, _commentsCount),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? Colors.grey[800] : Colors.grey[100],
                      ),
                      child: Icon(Icons.arrow_back, color: textMainColor),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      post != null
                          ? (post!['author']?['name'] as String? ??
                              AppLocalizations.of(context)!.unknown ??
                              'Unknown')
                          : (AppLocalizations.of(context)!.loadingAuthor ??
                              'Loading Author...'),
                      style: TextStyle(
                        color: textMainColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        body:
            loading
                ? const Center(child: CircularProgressIndicator())
                : SafeArea(
                  child: Column(
                    children: [
                      Expanded(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // content
                              if (post != null) ...[
                                Text(
                                  post!['content'] ?? '',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    height: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                // images vertical
                                if ((post!['media'] as List<dynamic>?)
                                        ?.isNotEmpty ??
                                    false)
                                  ...((post!['media'] as List<dynamic>)
                                      .map(
                                        (m) => Padding(
                                          padding: const EdgeInsets.only(
                                            bottom: 12,
                                          ),
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                            child: Image.network(
                                              m.toString(),
                                              width: double.infinity,
                                              height: 300,
                                              fit: BoxFit.cover,
                                            ),
                                          ),
                                        ),
                                      )
                                      .toList()),

                                const SizedBox(height: 12),
                                // reactions & comments row
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
                                            color: surfaceColor,
                                            borderRadius: BorderRadius.circular(
                                              10,
                                            ),
                                            border: Border.all(
                                              color: Theme.of(
                                                context,
                                              ).dividerColor.withOpacity(0.5),
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Icon(
                                                _currentReactionIcon(),
                                                size: 20,
                                                color:
                                                    _reacted
                                                        ? primaryColor
                                                        : textSubColor,
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                _likes.toString(),
                                                style: TextStyle(
                                                  color:
                                                      _reacted
                                                          ? primaryColor
                                                          : textSubColor,
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
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 10,
                                        ),
                                        decoration: BoxDecoration(
                                          color: primaryColor.withOpacity(0.08),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                          border: Border.all(
                                            color: primaryColor.withOpacity(
                                              0.2,
                                            ),
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Icon(
                                              Icons.chat_bubble_outline,
                                              size: 20,
                                              color: primaryColor,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              _commentsCount.toString(),
                                              style: TextStyle(
                                                color: primaryColor,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Divider(),
                                const SizedBox(height: 12),
                                Text(
                                  l10n?.comments ?? 'Comments',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                if ((post!['comments'] as List<dynamic>?)
                                        ?.isNotEmpty ??
                                    false)
                                  ...((post!['comments'] as List<dynamic>)
                                      .map(
                                        (c) => _buildCommentItem(
                                          c as Map<String, dynamic>,
                                        ),
                                      )
                                      .toList())
                                else
                                  Text(
                                    AppLocalizations.of(context)!.noComments ??
                                        'No comments yet',
                                  ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      // comment box
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Theme.of(context).cardColor,
                          border: Border(
                            top: BorderSide(color: Colors.grey.shade200),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_replyToName != null) ...[
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Replying to $_replyToName',
                                      style: TextStyle(
                                        color: _textSubColorTheme,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.close, size: 18),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    onPressed: () {
                                      setState(() {
                                        _replyToCommentId = null;
                                        _replyToName = null;
                                      });
                                    },
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                            ],
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _commentController,
                                    decoration: InputDecoration(
                                      hintText:
                                          _replyToName != null
                                              ? "Replying to $_replyToName"
                                              : AppLocalizations.of(
                                                    context,
                                                  )!.writeComment ??
                                                  'Write a comment...',
                                      border: InputBorder.none,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.send),
                                  onPressed: _postComment,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
      ),
    );
  }
}
