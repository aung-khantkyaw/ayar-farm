import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';
import '../services/user_service.dart';
import '../services/notification_service.dart';

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
  String? _editingCommentId;
  final Map<String, Map<String, dynamic>> _reactionUserCache = {};
  void Function(dynamic)? _postReactionListener;
  void Function(dynamic)? _postCommentListener;
  void Function(dynamic)? _postCommentUpdatedListener;
  void Function(dynamic)? _postCommentDeletedListener;
  void Function(dynamic)? _commentReactionListener;

  @override
  void initState() {
    super.initState();
    _loadPost();
    _setupRealtime();
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
      final currentUserId = AuthService.currentUser?.id.toString();
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

      _reactionUserCache.clear();
      _seedUserCacheFromReactions(reactions);

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

  void _setupRealtime() {
    final socket = SocketService().socket;
    if (socket == null) return;
    _postReactionListener = (data) => _handlePostReactionEvent(data);
    _postCommentListener = (data) => _handlePostCommentEvent(data);
    _postCommentUpdatedListener =
        (data) => _handlePostCommentUpdatedEvent(data);
    _postCommentDeletedListener =
        (data) => _handlePostCommentDeletedEvent(data);
    _commentReactionListener = (data) => _handleCommentReactionEvent(data);
    socket.on('post:reaction', _postReactionListener!);
    socket.on('post:comment', _postCommentListener!);
    socket.on('post:comment:updated', _postCommentUpdatedListener!);
    socket.on('post:comment:deleted', _postCommentDeletedListener!);
    socket.on('comment:reaction', _commentReactionListener!);
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
              if (_likes > 0)
                ListTile(
                  leading: const Icon(Icons.people_outline),
                  title: const Text('View reactions'),
                  onTap: () {
                    Navigator.pop(ctx);
                    _showPostReactionsSheet();
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

  void _seedUserCacheFromReactions(List reactions) {
    for (final r in reactions) {
      if (r is! Map) continue;
      _cacheUserFromReaction(r);
    }
  }

  void _cacheUserFromReaction(Map r) {
    final user = r['user'];
    final userId = (r['userId'] ?? r['user_id'] ?? user?['id'])?.toString();
    if (userId == null) return;
    if (_reactionUserCache.containsKey(userId) &&
        (_reactionUserCache[userId]?['name'] != null))
      return;

    final cached = <String, dynamic>{};
    if (user is Map) {
      cached['name'] = user['name']?.toString();
      cached['profilePicture'] =
          user['profilePicture'] ?? user['profile_picture'];
    }
    cached['profilePicture'] ??=
        r['profilePicture'] ?? r['profile_picture'] ?? r['avatar'];
    cached['name'] ??= r['userName']?.toString();
    _reactionUserCache[userId] = cached;
  }

  Future<void> _sendReactionNotification(String reactionType) async {
    final actor = AuthService.currentUser;
    if (actor == null) return;
    final authorId =
        (post?['author']?['id'] ?? post?['authorId'] ?? post?['author_id'])
            ?.toString();
    if (authorId == null || authorId == actor.id) return;

    final message = '${actor.name} reacted to your post.';
    await NotificationService().sendRemote(
      userId: authorId,
      message: message,
      data: {
        'type': 'reaction',
        'postId': widget.postId,
        'reactionType': reactionType,
      },
    );
  }

  Future<void> _sendCommentNotification(Map<String, dynamic> comment) async {
    final actor = AuthService.currentUser;
    if (actor == null) return;

    final parentId = comment['parentCommentId'] ?? comment['parent_comment_id'];
    String? targetId;
    String type = 'comment';

    if (parentId != null) {
      final parent = _findComment(parentId.toString());
      final parentAuthorId =
          (parent?['author']?['id'] ??
                  parent?['authorId'] ??
                  parent?['author_id'])
              ?.toString();
      if (parentAuthorId != null && parentAuthorId != actor.id) {
        targetId = parentAuthorId;
        type = 'reply';
      }
    }

    if (targetId == null) {
      final authorId =
          (post?['author']?['id'] ?? post?['authorId'] ?? post?['author_id'])
              ?.toString();
      if (authorId == null || authorId == actor.id) return;
      targetId = authorId;
    }

    final message =
        type == 'reply'
            ? '${actor.name} replied to your comment.'
            : '${actor.name} commented on your post.';

    await NotificationService().sendRemote(
      userId: targetId,
      message: message,
      data: {
        'type': type,
        'postId': widget.postId,
        'commentId': comment['id']?.toString(),
      },
    );
  }

  Future<void> _ensureReactionUsersLoaded(List reactions) async {
    final missing = <String>[];
    for (final r in reactions) {
      if (r is! Map) continue;
      final userId =
          (r['userId'] ?? r['user_id'] ?? r['user']?['id'])?.toString();
      if (userId == null) continue;
      if (_reactionUserCache[userId]?['name'] != null) continue;
      missing.add(userId);
    }
    for (final id in missing) {
      try {
        final user = await UserService.getUserById(id);
        if (user != null) {
          _reactionUserCache[id] = {
            'name': user.name,
            'profilePicture': user.profilePicture,
          };
          if (mounted) setState(() {});
        }
      } catch (_) {
        // ignore missing user
      }
    }
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

      await _sendReactionNotification(newType);
    } catch (_) {
      // optionally surface a snackbar
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

  IconData _reactionIconForType(String? type) {
    switch (type) {
      case 'UNLIKE':
        return Icons.thumb_down;
      case 'SUPPORT':
        return Icons.volunteer_activism;
      case 'CARE':
        return Icons.favorite;
      case 'LIKE':
      default:
        return Icons.thumb_up;
    }
  }

  String _reactionLabel(String? type) {
    switch (type) {
      case 'UNLIKE':
        return 'Unlike';
      case 'SUPPORT':
        return 'Support';
      case 'CARE':
        return 'Care';
      case 'LIKE':
      default:
        return 'Like';
    }
  }

  Future<void> _showPostReactionsSheet() async {
    final reactions = (post?['reactions'] as List?) ?? [];
    if (reactions.isEmpty) return;

    await _ensureReactionUsersLoaded(reactions);
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Reactions',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
              const Divider(height: 1),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: reactions.length,
                  itemBuilder: (context, index) {
                    final r = reactions[index];
                    if (r is! Map) return const SizedBox.shrink();
                    final type = r['type']?.toString();
                    final userId =
                        (r['userId'] ?? r['user_id'] ?? r['user']?['id'])
                            ?.toString();
                    final cached =
                        userId != null ? _reactionUserCache[userId] : null;
                    final inlineUser = r['user'] as Map?;
                    final name =
                        cached?['name']?.toString() ??
                        inlineUser?['name']?.toString() ??
                        r['userName']?.toString() ??
                        (userId ?? 'Unknown');
                    final avatar =
                        cached?['profilePicture'] ??
                        inlineUser?['profilePicture'] ??
                        inlineUser?['profile_picture'] ??
                        r['profilePicture'] ??
                        r['profile_picture'];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundImage:
                            avatar != null ? NetworkImage(avatar) : null,
                        child:
                            avatar == null
                                ? Text(
                                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                                )
                                : null,
                      ),
                      title: Text(name),
                      subtitle: Text(_reactionLabel(type)),
                      trailing: Icon(
                        _reactionIconForType(type),
                        color: const Color(0xFF2BEE5B),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  bool _isCurrentUserComment(Map c) {
    final currentUserId = AuthService.currentUser?.id.toString();
    if (currentUserId == null) return false;
    final authorId =
        (c['author']?['id'] ?? c['authorId'] ?? c['author_id'])?.toString();
    return authorId == currentUserId;
  }

  Widget _buildCommentItem(Map<String, dynamic> c, {bool isReply = false}) {
    final author = c['author'] ?? {};
    final name = author['name']?.toString() ?? 'Unknown';
    final profile = author['profile_picture'] ?? author['profilePicture'];
    final reactionType = _commentReactionType(c);
    final reacted = reactionType != null;
    final reactionCount = _commentReactionCount(c);
    final replies = (c['replies'] ?? []) as List<dynamic>;
    final isOwner = _isCurrentUserComment(c);

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
                        Text(
                          _commentTimeLabel(c),
                          style: TextStyle(
                            color: _textSubColorTheme,
                            fontSize: 12,
                          ),
                        ),
                        if (isOwner) ...[
                          const SizedBox(width: 4),
                          PopupMenuButton<String>(
                            padding: EdgeInsets.zero,
                            iconSize: 18,
                            icon: Icon(
                              Icons.more_vert,
                              color: _textSubColorTheme,
                            ),
                            onSelected: (value) {
                              switch (value) {
                                case 'edit':
                                  _startEditComment(c);
                                  break;
                                case 'delete':
                                  _confirmDeleteComment(c);
                                  break;
                              }
                            },
                            itemBuilder:
                                (ctx) => const [
                                  PopupMenuItem(
                                    value: 'edit',
                                    child: Text('Edit'),
                                  ),
                                  PopupMenuItem(
                                    value: 'delete',
                                    child: Text('Delete'),
                                  ),
                                ],
                          ),
                        ],
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

  void _startEditComment(Map<String, dynamic> c) {
    final commentId = c['id']?.toString();
    if (commentId == null) return;
    setState(() {
      _editingCommentId = commentId;
      _replyToCommentId = null;
      _replyToName = null;
      _commentController.text = c['content']?.toString() ?? '';
    });
  }

  Future<void> _submitEditComment(String content) async {
    final commentId = _editingCommentId;
    if (commentId == null || content.isEmpty) return;

    try {
      final res = await ApiService.put(
        '${ApiConstants.posts}/${widget.postId}/comments/$commentId',
        {'content': content},
      );
      final updated = res['data'] ?? res;
      if (!mounted) return;
      setState(() {
        final existing = _findComment(commentId);
        if (existing != null) {
          existing['content'] = updated['content'] ?? content;
          if (updated['updatedAt'] != null) {
            existing['updatedAt'] = updated['updatedAt'];
          }
        }
        _editingCommentId = null;
      });
      _commentController.clear();
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Error updating comment')));
    }
  }

  Future<void> _confirmDeleteComment(Map<String, dynamic> c) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Delete comment?'),
          content: const Text('This action cannot be undone.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed == true) {
      await _deleteComment(c);
    }
  }

  Future<void> _deleteComment(Map<String, dynamic> c) async {
    final commentId = c['id']?.toString();
    if (commentId == null) return;

    try {
      await ApiService.delete(
        '${ApiConstants.posts}/${widget.postId}/comments/$commentId',
      );
      if (!mounted) return;
      setState(() {
        final removed = _removeCommentFromLocal(commentId);
        if (removed) {
          _commentsCount = (_commentsCount - 1).clamp(0, 1 << 30);
        }
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Error deleting comment')));
    }
  }

  bool _removeCommentFromLocal(String id) {
    final comments = (post?['comments'] ?? []) as List<dynamic>;
    for (var i = 0; i < comments.length; i++) {
      final c = comments[i];
      if (c is Map && c['id']?.toString() == id) {
        comments.removeAt(i);
        post?['comments'] = comments;
        return true;
      }

      final replies = (c is Map ? c['replies'] : null) as List<dynamic>?;
      if (replies != null) {
        for (var j = 0; j < replies.length; j++) {
          final r = replies[j];
          if (r is Map && r['id']?.toString() == id) {
            replies.removeAt(j);
            c['replies'] = replies;
            return true;
          }
        }
      }
    }
    return false;
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
    if (_editingCommentId != null) {
      await _submitEditComment(text);
      return;
    }
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
        _editingCommentId = null;
      });
      if (newComment is Map<String, dynamic>) {
        await _sendCommentNotification(newComment);
      }
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
      if (c['id']?.toString() == id) return c as Map<String, dynamic>;
      final replies = (c['replies'] ?? []) as List<dynamic>;
      for (final r in replies) {
        if (r['id']?.toString() == id) return r as Map<String, dynamic>;
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
    final socket = SocketService().socket;
    if (socket != null) {
      if (_postReactionListener != null)
        socket.off('post:reaction', _postReactionListener!);
      if (_postCommentListener != null)
        socket.off('post:comment', _postCommentListener!);
      if (_postCommentUpdatedListener != null)
        socket.off('post:comment:updated', _postCommentUpdatedListener!);
      if (_postCommentDeletedListener != null)
        socket.off('post:comment:deleted', _postCommentDeletedListener!);
      if (_commentReactionListener != null)
        socket.off('comment:reaction', _commentReactionListener!);
    }
    super.dispose();
  }

  void _handlePostReactionEvent(dynamic data) {
    if (data == null || data['postId']?.toString() != widget.postId) return;
    final action = data['action']?.toString();
    final userId = data['userId']?.toString();
    final reactionType = data['reactionType']?.toString();
    if (!mounted) return;
    setState(() {
      final isCurrentUser =
          userId != null && userId == AuthService.currentUser?.id.toString();
      if (action == 'added') {
        // Avoid double-counting for the actor; local optimistic update already handled.
        if (!isCurrentUser) {
          _likes = _likes + 1;
        }
        if (isCurrentUser) {
          _reactionType = reactionType;
          _reacted = true;
        }
      } else if (action == 'removed') {
        if (!isCurrentUser) {
          _likes = (_likes - 1).clamp(0, 1 << 30);
        }
        if (isCurrentUser) {
          _reactionType = null;
          _reacted = false;
        }
      } else if (action == 'updated') {
        if (isCurrentUser) {
          _reactionType = reactionType;
          _reacted = true;
        }
      }
    });
  }

  void _handlePostCommentEvent(dynamic data) {
    if (data == null || data['postId']?.toString() != widget.postId) return;
    final comment = data['comment'];
    if (comment is! Map) return;
    final authorId =
        (comment['author']?['id'] ??
                comment['authorId'] ??
                comment['author_id'])
            ?.toString();
    if (authorId != null &&
        authorId == AuthService.currentUser?.id.toString()) {
      // Already applied locally when posting; skip to avoid double count.
      return;
    }
    if (!mounted) return;
    setState(() {
      post ??= {};
      final parentId =
          comment['parentCommentId'] ?? comment['parent_comment_id'];
      if (parentId != null) {
        final target = _findComment(parentId.toString());
        if (target != null) {
          final replies = (target['replies'] ?? []) as List;
          replies.add(comment);
          target['replies'] = replies;
        }
      } else {
        final comments = (post!['comments'] ?? []) as List<dynamic>;
        comments.insert(0, comment);
        post!['comments'] = comments;
      }
      _commentsCount = _commentsCount + 1;
    });
  }

  void _handlePostCommentUpdatedEvent(dynamic data) {
    if (data == null || data['postId']?.toString() != widget.postId) return;
    final comment = data['comment'];
    if (comment is! Map) return;
    final id = comment['id']?.toString();
    if (id == null) return;
    if (!mounted) return;
    setState(() {
      final existing = _findComment(id);
      if (existing != null) {
        existing['content'] = comment['content'] ?? existing['content'];
        if (comment['updatedAt'] != null) {
          existing['updatedAt'] = comment['updatedAt'];
        }
      }
    });
  }

  void _handlePostCommentDeletedEvent(dynamic data) {
    if (data == null || data['postId']?.toString() != widget.postId) return;
    final userId = data['userId']?.toString();
    if (userId != null && userId == AuthService.currentUser?.id.toString()) {
      // Local delete already adjusted counts.
      return;
    }
    final commentId = data['commentId']?.toString();
    if (commentId == null) return;
    final deletedCount = _asInt(data['deletedCount']) ?? 1;
    if (!mounted) return;
    setState(() {
      final removed = _removeCommentFromLocal(commentId);
      if (removed) {
        _commentsCount = (_commentsCount - deletedCount).clamp(0, 1 << 30);
      }
    });
  }

  void _handleCommentReactionEvent(dynamic data) {
    if (data == null || data['postId']?.toString() != widget.postId) return;
    final commentId = data['commentId']?.toString();
    if (commentId == null) return;
    final action = data['action']?.toString();
    final reactionType = data['reactionType']?.toString();
    final userId = data['userId']?.toString();
    if (userId != null && userId == AuthService.currentUser?.id.toString()) {
      // Local optimistic update already handled.
      return;
    }
    final target = _findComment(commentId);
    if (target == null || userId == null) return;

    setState(() {
      final reactions = List<Map<String, dynamic>>.from(
        (target['reactions'] ?? []) as List,
      );
      final idx = reactions.indexWhere((r) {
        final uid =
            (r['userId'] ?? r['user_id'] ?? r['user']?['id'])?.toString();
        return uid == userId;
      });
      if (action == 'removed') {
        if (idx >= 0) {
          reactions.removeAt(idx);
          final cnt = _commentReactionCount(target) - 1;
          target['_count'] = {
            ...(target['_count'] ?? {}),
            'reactions': cnt.clamp(0, 1 << 30),
          };
        }
      } else if (action == 'updated') {
        if (idx >= 0) {
          reactions[idx]['type'] = reactionType;
        }
      } else if (action == 'added') {
        if (idx >= 0) {
          reactions[idx]['type'] = reactionType;
        } else {
          reactions.add({'userId': userId, 'type': reactionType});
          final cnt = _commentReactionCount(target) + 1;
          target['_count'] = {...(target['_count'] ?? {}), 'reactions': cnt};
        }
      }
      target['reactions'] = reactions;
    });
  }

  String? _mediaEntryToUrl(dynamic entry) {
    if (entry is Map) {
      final url = entry['url'] ?? entry['thumbnail'];
      if (url is String) return url;
    }
    if (entry is String) return entry;
    return null;
  }

  dynamic _tryParseMediaJson(String raw) {
    try {
      return jsonDecode(raw);
    } catch (_) {
      return null;
    }
  }

  List<String> _extractUrlsFromString(String text) {
    final regex = RegExp(r'https?://[^\s"\\]+');
    return regex.allMatches(text).map((m) => m.group(0)!).toList();
  }

  List<String> _mediaUrls(dynamic media) {
    if (media is List) {
      return media.map(_mediaEntryToUrl).whereType<String>().toList();
    }
    if (media is Map) {
      final url = _mediaEntryToUrl(media);
      if (url != null) return [url];
    }
    if (media is String) {
      final parsed = _tryParseMediaJson(media);
      if (parsed != null) {
        return _mediaUrls(parsed);
      }
      final urls = _extractUrlsFromString(media);
      if (urls.isNotEmpty) return urls;
      return [media];
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final l10n = AppLocalizations.of(context);
    final mediaUrls = _mediaUrls(post?['media']);

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
                              AppLocalizations.of(context)!.unknown)
                          : (AppLocalizations.of(context)!.loadingAuthor),
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
                                if (mediaUrls.isNotEmpty)
                                  ...(mediaUrls
                                      .map(
                                        (url) => Padding(
                                          padding: const EdgeInsets.only(
                                            bottom: 12,
                                          ),
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                            child: Image.network(
                                              url,
                                              width: double.infinity,
                                              height: 300,
                                              fit: BoxFit.cover,
                                              errorBuilder:
                                                  (_, __, ___) => Container(
                                                    width: double.infinity,
                                                    height: 300,
                                                    color: Colors.grey[300],
                                                    alignment: Alignment.center,
                                                    child: const Icon(
                                                      Icons.broken_image,
                                                      size: 48,
                                                      color: Colors.black45,
                                                    ),
                                                  ),
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
                                        onLongPress: _showPostReactionsSheet,
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
                                    AppLocalizations.of(context)!.noComments,
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
                            if (_editingCommentId != null) ...[
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Editing your comment',
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
                                        _editingCommentId = null;
                                        _commentController.clear();
                                      });
                                    },
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                            ],
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
                                          _editingCommentId != null
                                              ? 'Update your comment'
                                              : _replyToName != null
                                              ? "Replying to $_replyToName"
                                              : AppLocalizations.of(
                                                context,
                                              )!.writeComment,
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
