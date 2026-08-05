import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/post_service.dart';
import '../services/user_service.dart';
import '../models/post.dart';
import '../models/user.dart';
import '../constants/user_types.dart';
import 'edit_profile_screen.dart';
import 'create_post_screen.dart';
import '../widgets/common_post_card.dart';
import '../services/socket_service.dart';

class ProfileScreen extends StatefulWidget {
  final String userId;
  const ProfileScreen({super.key, required this.userId});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Colors from HTML
  static const _primaryColor = Color(0xFF2BEE5B);
  static const _bgLight = Color(0xFFF6F8F6);
  static const _bgDark = Color(0xFF102215);
  static const _textLight = Color(0xFF111813);

  User? _user;
  bool _isLoading = true;
  late Future<List<Post>> _postsFuture;
  List<Post> _livePosts = [];
  void Function(dynamic)? _postReactionListener;
  void Function(dynamic)? _postCommentListener;
  void Function(dynamic)? _postCommentDeletedListener;

  @override
  void initState() {
    super.initState();
    _loadData();
    _setupRealtime();
  }

  Future<void> _loadData() async {
    // If it's the current user, use cached data immediately for better UX
    if (widget.userId == AuthService.currentUser?.id) {
      _user = AuthService.currentUser;
    }

    // Fetch fresh user data
    try {
      final user = await UserService.getUserById(widget.userId);
      if (user != null) {
        if (mounted) {
          setState(() {
            _user = user;
          });
        }
      }
    } catch (e) {
      debugPrint("Error fetching user: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }

    _loadPosts();
  }

  void _loadPosts() {
    _postsFuture = PostService.getPosts(userId: widget.userId);
    _postsFuture.then((posts) {
      if (mounted) {
        setState(() {
          _livePosts = posts;
        });
      }
    });
  }

  void _setupRealtime() {
    final socket = SocketService().socket;
    if (socket == null) return;
    _postReactionListener = (data) => _handlePostReactionEvent(data);
    _postCommentListener = (data) => _handlePostCommentEvent(data);
    _postCommentDeletedListener =
        (data) => _handlePostCommentDeletedEvent(data);
    socket.on('post:reaction', _postReactionListener!);
    socket.on('post:comment', _postCommentListener!);
    socket.on('post:comment:deleted', _postCommentDeletedListener!);
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 365) {
      return DateFormat.yMMMd().format(date);
    } else if (diff.inDays > 30) {
      return DateFormat.MMMd().format(date);
    } else if (diff.inDays > 0) {
      return '${diff.inDays}d ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours}h ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  Color _getUserTypeColor(String? userType) {
    switch (userType) {
      case UserTypes.admin:
        return Colors.red;
      case UserTypes.farmer:
        return const Color(0xFF2BEE5B); // Primary Green
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

  @override
  void dispose() {
    final socket = SocketService().socket;
    if (socket != null) {
      if (_postReactionListener != null)
        socket.off('post:reaction', _postReactionListener!);
      if (_postCommentListener != null)
        socket.off('post:comment', _postCommentListener!);
      if (_postCommentDeletedListener != null)
        socket.off('post:comment:deleted', _postCommentDeletedListener!);
    }
    super.dispose();
  }

  void _handlePostReactionEvent(dynamic data) {
    if (data == null) return;
    final postId = data['postId']?.toString();
    if (postId == null) return;
    final action = data['action']?.toString();
    final userId = data['userId']?.toString();
    // Skip local actor to avoid double +/-; their optimistic update handles it.
    if (userId != null && userId == AuthService.currentUser?.id) return;
    final reactionType = data['reactionType']?.toString();
    setState(() {
      _livePosts =
          _livePosts.map((p) {
            if (p.id != postId || userId == null || action == null) return p;
            return _updatePostReaction(p, action, userId, reactionType);
          }).toList();
    });
  }

  void _handlePostCommentEvent(dynamic data) {
    if (data == null) return;
    final postId = data['postId']?.toString();
    if (postId == null) return;
    final userId = data['userId']?.toString();
    if (userId != null && userId == AuthService.currentUser?.id) return;
    setState(() {
      _livePosts =
          _livePosts.map((p) {
            if (p.id != postId) return p;
            final newCount = p.counts.comments + 1;
            return Post(
              id: p.id,
              content: p.content,
              authorId: p.authorId,
              createdAt: p.createdAt,
              media: p.media,
              tags: p.tags,
              author: p.author,
              counts: PostCount(
                reactions: p.counts.reactions,
                comments: newCount,
              ),
              reactionUserIds: p.reactionUserIds,
              reactions: p.reactions,
            );
          }).toList();
    });
  }

  void _handlePostCommentDeletedEvent(dynamic data) {
    if (data == null) return;
    final postId = data['postId']?.toString();
    if (postId == null) return;
    final userId = data['userId']?.toString();
    if (userId != null && userId == AuthService.currentUser?.id) return;
    final deletedCount = _asInt(data['deletedCount']) ?? 1;
    setState(() {
      _livePosts =
          _livePosts.map((p) {
            if (p.id != postId) return p;
            final newCount = (p.counts.comments - deletedCount).clamp(
              0,
              1 << 30,
            );
            return Post(
              id: p.id,
              content: p.content,
              authorId: p.authorId,
              createdAt: p.createdAt,
              media: p.media,
              tags: p.tags,
              author: p.author,
              counts: PostCount(
                reactions: p.counts.reactions,
                comments: newCount,
              ),
              reactionUserIds: p.reactionUserIds,
              reactions: p.reactions,
            );
          }).toList();
    });
  }

  int? _asInt(Object? value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }

  Post _updatePostReaction(
    Post post,
    String action,
    String userId,
    String? reactionType,
  ) {
    final reactions = List<PostReaction>.from(post.reactions);
    final idx = reactions.indexWhere((r) => r.userId == userId);

    if (action == 'removed') {
      if (idx >= 0) {
        reactions.removeAt(idx);
      }
    } else if (action == 'updated') {
      if (idx >= 0) {
        reactions[idx] = PostReaction(
          userId: userId,
          type: reactionType ?? reactions[idx].type,
        );
      } else {
        reactions.add(
          PostReaction(userId: userId, type: reactionType ?? 'LIKE'),
        );
      }
    } else if (action == 'added') {
      if (idx >= 0) {
        reactions[idx] = PostReaction(
          userId: userId,
          type: reactionType ?? reactions[idx].type,
        );
      } else {
        reactions.add(
          PostReaction(userId: userId, type: reactionType ?? 'LIKE'),
        );
      }
    }

    final reactionUserIds = reactions.map((r) => r.userId).toList();
    final reactionCount = reactions.length;

    return Post(
      id: post.id,
      content: post.content,
      authorId: post.authorId,
      createdAt: post.createdAt,
      media: post.media,
      tags: post.tags,
      author: post.author,
      counts: PostCount(
        reactions: reactionCount,
        comments: post.counts.comments,
      ),
      reactionUserIds: reactionUserIds,
      reactions: reactions,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _user;
    final isCurrentUser =
        user != null && user.id == AuthService.currentUser?.id;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? _bgDark : _bgLight;
    final textColor = isDark ? Colors.white : _textLight;
    final cardColor =
        isDark
            ? const Color(0xFF1a261f)
            : Colors.white; // Adjusted simpler dark card
    final borderColor = isDark ? Colors.grey[800]! : const Color(0xFFDBE6DE);

    final l10n = AppLocalizations.of(context);

    if (_isLoading && user == null) {
      return Scaffold(
        backgroundColor: bgColor,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (user == null) {
      return Scaffold(
        backgroundColor: bgColor,
        appBar: AppBar(backgroundColor: bgColor, elevation: 0),
        body: const Center(child: Text("User not found")),
      );
    }

    return Scaffold(
      backgroundColor: bgColor,
      body: CustomScrollView(
        slivers: [
          // Top Navigation Bar (Sticky equivalent using SliverAppBar)
          SliverAppBar(
            pinned: true,
            backgroundColor:
                isDark
                    ? _bgDark.withOpacity(0.9)
                    : Colors.white.withOpacity(0.9),
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: CircleAvatar(
                  backgroundColor: isDark ? Colors.grey[800] : Colors.grey[100],
                  child: Icon(
                    Icons.arrow_back_ios_new,
                    color: textColor,
                    size: 18,
                  ),
                ),
              ),
            ),
            title: Text(
              'Profile',
              style: TextStyle(
                color: textColor,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            centerTitle: true,
            elevation: 0,
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(
                color: isDark ? Colors.grey[800] : Colors.grey[100],
                height: 1,
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Section (Cover + Profile Pic)
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Cover Photo
                    Container(
                      height: 192, // h-48 = 12rem = 192px
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        color: Colors.grey,
                        image: DecorationImage(
                          image: NetworkImage(
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuBdoO3N2fJsaAwR-2pYUM4E2hjLmtE8WiTlyViAVpq_rGdMrCIRbnszK1ELhYRrBng2DC1mQWMHgRVnHdgVjJuA1olt0u-uJzep1dUbtyVRkWs2DYbGS354Z3WliLoQ-751_g4-ZSSXvTE3uMoSawpi4dqweM13NBTvCM4yB9nyuVTp7xuygNytoVwGBtZSG8RqU5wtY_Df86k8mjrp7ydx5SKg6JGGIX268KrTNMfGXrYJf2_6WKglQE6XuoAiC41tVFN4n-QFS6NG",
                          ),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    // Profile Picture Overlap
                    Positioned(
                      bottom: -64,
                      left: 16,
                      child: Stack(
                        children: [
                          Container(
                            height: 128,
                            width: 128,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: _getUserTypeColor(user.userType),
                                width: 4,
                              ),
                              image: DecorationImage(
                                image: NetworkImage(
                                  user.profilePicture ??
                                      "https://lh3.googleusercontent.com/aida-public/AB6AXuA9ewvkffzPg2DVJEM93D25jdhjC8Kq4BSClkdT7GiLz1Dqs3YYXiMNVU4RYXGTjXSsjkX84yOspLDkfZw0_9QkI32lCjtP3IdMwBh7mp7kY4ZDf_F7MgQEQG3i8yUwPsyzoPkJ15LyL60egXLznpCpABaqmB98USnmyujPPjvaBNKCfnkVBGkYkkXpkIGYFliuTuTDdzmBiSVIv0cb5wqfK3FkSRF2ANWJ-_T6Qfjthaqv9Kktq_XqHpfvbbZ5CEyi3m-0FlRZ4SgU",
                                ),
                                fit: BoxFit.cover,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: _getUserTypeColor(user.userType),
                                shape: BoxShape.circle,
                                border: Border.all(color: bgColor, width: 4),
                              ),
                              child: Icon(
                                _getUserTypeIcon(user.userType),
                                size: 24,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 70), // Space for overlapped profile pic
                // User Identity & Actions
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Flexible(
                            child: Text(
                              user.name,
                              style: TextStyle(
                                color: textColor,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                height: 1.2,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: _getUserTypeColor(
                                user.userType,
                              ).withOpacity(0.2),
                              border: Border.all(
                                color: _getUserTypeColor(user.userType),
                                width: 1.5,
                              ),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              userTypeLabels[user.userType] ??
                                  (user.userType?.toUpperCase() ?? 'FARMER'),
                              style: TextStyle(
                                color:
                                    isDark
                                        ? _getUserTypeColor(user.userType)
                                        : _textLight,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (isCurrentUser)
                        Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const EditProfileScreen(),
                                    ),
                                  ).then(
                                    (_) => setState(() {}),
                                  ); // Refresh on returning
                                },
                                child: Container(
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color:
                                        isDark
                                            ? Colors.grey[800]
                                            : Colors.grey[200],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    l10n?.editProfile ?? 'Edit Profile',
                                    style: TextStyle(
                                      color: textColor,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: InkWell(
                                onTap: () async {
                                  final result = await Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const CreatePostScreen(),
                                    ),
                                  );
                                  if (result == true) {
                                    setState(() {
                                      _loadPosts();
                                    });
                                  }
                                },
                                child: Container(
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: _primaryColor,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    'Add Post',
                                    style: const TextStyle(
                                      color: Color(0xFF111813),
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),

                // Quick Stats
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      FutureBuilder<List<Post>>(
                        future: _postsFuture,
                        builder: (context, snapshot) {
                          final posts =
                              _livePosts.isNotEmpty
                                  ? _livePosts
                                  : (snapshot.data ?? []);
                          return _buildStatCard(
                            "${posts.length}",
                            "Posts",
                            cardColor,
                            borderColor,
                            textColor,
                            isDark,
                          );
                        },
                      ),
                      const SizedBox(width: 12),
                      FutureBuilder<List<Post>>(
                        future: _postsFuture,
                        builder: (context, snapshot) {
                          final posts =
                              _livePosts.isNotEmpty
                                  ? _livePosts
                                  : (snapshot.data ?? []);
                          final info = posts.fold(
                            0,
                            (sum, item) => sum + item.counts.comments,
                          );
                          return _buildStatCard(
                            "$info",
                            "Comments",
                            cardColor,
                            borderColor,
                            textColor,
                            isDark,
                          );
                        },
                      ),
                      const SizedBox(width: 12),
                      FutureBuilder<List<Post>>(
                        future: _postsFuture,
                        builder: (context, snapshot) {
                          final posts =
                              _livePosts.isNotEmpty
                                  ? _livePosts
                                  : (snapshot.data ?? []);
                          final info = posts.fold(
                            0,
                            (sum, item) => sum + item.counts.reactions,
                          );
                          return _buildStatCard(
                            "$info",
                            "Reactions",
                            cardColor,
                            borderColor,
                            textColor,
                            isDark,
                          );
                        },
                      ),
                    ],
                  ),
                ),

                // Bio & Intro Card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: cardColor,
                      border: Border.all(color: borderColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildInfoRow(
                          Icons.location_on_outlined,
                          user.location ?? "Central Valley, California",
                          isDark,
                        ),
                        const SizedBox(height: 12),
                        _buildInfoRow(
                          Icons.calendar_today_outlined,
                          user.createdAt != null
                              ? "Joined ${DateFormat('MMMM yyyy').format(user.createdAt!)}"
                              : "Joined March 2014",
                          isDark,
                        ),
                        if (user.phoneNumber != null &&
                            user.phoneNumber!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          _buildInfoRow(
                            Icons.phone_outlined,
                            user.phoneNumber!,
                            isDark,
                          ),
                        ],
                        if (user.email != null && user.email!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          _buildInfoRow(
                            Icons.email_outlined,
                            user.email!,
                            isDark,
                          ),
                        ],
                        if (user.gender != null && user.gender!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          _buildInfoRow(
                            Icons.person_outline,
                            user.gender!,
                            isDark,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                FutureBuilder<List<Post>>(
                  future: _postsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting &&
                        _livePosts.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }
                    if (snapshot.hasError) {
                      return Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          'Error loading posts',
                          style: TextStyle(color: textColor),
                        ),
                      );
                    }
                    final posts =
                        _livePosts.isNotEmpty
                            ? _livePosts
                            : (snapshot.data ?? []);
                    if (posts.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Center(
                          child: Text(
                            "No posts shared yet",
                            style: TextStyle(color: Colors.grey[500]),
                          ),
                        ),
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: posts.length,
                      separatorBuilder:
                          (context, index) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final post = posts[index];
                        final currentUserId = AuthService.currentUser?.id;
                        PostReaction? userReaction;
                        if (currentUserId != null) {
                          for (final r in post.reactions) {
                            if (r.userId == currentUserId) {
                              userReaction = r;
                              break;
                            }
                          }
                        }
                        final reacted = userReaction != null;
                        final reactionType = userReaction?.type;
                        return CommonPostCard(
                          surfaceColor: cardColor,
                          borderColor: borderColor,
                          textMainColor: textColor,
                          textSubColor:
                              isDark
                                  ? Colors.grey[400]!
                                  : const Color(0xFF61896B),
                          primaryColor: _primaryColor,
                          authorId: post.author.id,
                          authorName: post.author.name,
                          timeAgo: _timeAgo(post.createdAt),
                          authorAvatarUrl:
                              post.author.profilePicture ??
                              "https://lh3.googleusercontent.com/aida-public/AB6AXuA9ewvkffzPg2DVJEM93D25jdhjC8Kq4BSClkdT7GiLz1Dqs3YYXiMNVU4RYXGTjXSsjkX84yOspLDkfZw0_9QkI32lCjtP3IdMwBh7mp7kY4ZDf_F7MgQEQG3i8yUwPsyzoPkJ15LyL60egXLznpCpABaqmB98USnmyujPPjvaBNKCfnkVBGkYkkXpkIGYFliuTuTDdzmBiSVIv0cb5wqfK3FkSRF2ANWJ-_T6Qfjthaqv9Kktq_XqHpfvbbZ5CEyi3m-0FlRZ4SgU",
                          content: post.content ?? '',
                          images:
                              post.media.isNotEmpty
                                  ? post.media
                                      .map((m) => m.thumbnail ?? m.url)
                                      .cast<String>()
                                      .toList()
                                  : null,
                          postId: post.id,
                          tag: post.tags.isNotEmpty ? post.tags.first : null,
                          likesCount: post.counts.reactions.toString(),
                          commentsCount: post.counts.comments.toString(),
                          isCurrentUser:
                              post.author.id == AuthService.currentUser?.id,
                          userType: post.author.userType,
                          reacted: reacted,
                          reactionType: reactionType,
                          onProfileTap: () {
                            // If we are already on this user's profile, maybe avoid pushing?
                            // But checking that is complex. Pushing new instance is safe.
                            if (user.id != post.author.id) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder:
                                      (context) =>
                                          ProfileScreen(userId: post.author.id),
                                ),
                              );
                            }
                          },
                        );
                      },
                    );
                  },
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String value,
    String label,
    Color bgColor,
    Color borderColor,
    Color textColor,
    bool isDark,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bgColor, // check bg-white dark:bg-gray-900/50
          border: Border.all(color: borderColor),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: TextStyle(
                color: textColor,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label.toUpperCase(),
              style: TextStyle(
                color: isDark ? Colors.grey[400] : const Color(0xFF61896B),
                fontSize: 10,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(
    IconData icon,
    String text,
    bool isDark, {
    bool link = false,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: isDark ? Colors.grey[300] : const Color(0xFF61896B),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color:
                  link
                      ? _primaryColor
                      : (isDark ? Colors.grey[300] : const Color(0xFF61896B)),
              fontSize: 14,
            ),
          ),
        ),
      ],
    );
  }
}
