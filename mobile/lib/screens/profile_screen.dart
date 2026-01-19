import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import 'package:intl/intl.dart';
import '../services/auth_service.dart';
import '../services/post_service.dart';
import '../models/post.dart';
import '../models/user.dart';
import '../constants/user_types.dart';
import 'edit_profile_screen.dart';
import 'create_post_screen.dart';

class ProfileScreen extends StatefulWidget {
  final User? user;
  const ProfileScreen({super.key, this.user});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Colors from HTML
  static const _primaryColor = Color(0xFF2BEE5B);
  static const _bgLight = Color(0xFFF6F8F6);
  static const _bgDark = Color(0xFF102215);
  static const _textLight = Color(0xFF111813);

  late Future<List<Post>> _postsFuture;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  void _loadPosts() {
    final user = widget.user ?? AuthService.currentUser;
    if (user != null) {
      _postsFuture = PostService.getPosts(userId: user.id);
    } else {
      _postsFuture = Future.value([]);
    }
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

  @override
  Widget build(BuildContext context) {
    final user = widget.user ?? AuthService.currentUser;
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

    if (user == null) {
      return Scaffold(
        backgroundColor: bgColor,
        body: const Center(child: CircularProgressIndicator()),
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
                                      "https://lh3.googleusercontent.com/aida-public/AB6AXuAAvekwvU6oweISzBfhAUuUJ02UaAUla-SbyblO6bvY_WQNd2lcr8rjYbNNqLerMt_NAJ155wZEGzu_C55ZPh6hIjcC91jNWxF7PCTwLe5rSMvLuYjhneskA6684T2ZR7Y_c_X08pnJCECf7ST9e_WEgOxk27sUDlic4WkeA4QwqpgMN6WuhkIjP7nnNCOw_WD5X1yR8XD3Jba7v37KW_1cAhm3wsu7HwFoRmcY-ERyEA0QfqZeP0A8JScAWIUEb9rCLVzC5aBTN-Jr",
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
                          return _buildStatCard(
                            snapshot.hasData ? "${snapshot.data!.length}" : "-",
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
                          int info = 0;
                          if (snapshot.hasData) {
                            info = snapshot.data!.fold(
                              0,
                              (sum, item) => sum + item.counts.comments,
                            );
                          }
                          return _buildStatCard(
                            snapshot.hasData ? "$info" : "-",
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
                          int info = 0;
                          if (snapshot.hasData) {
                            info = snapshot.data!.fold(
                              0,
                              (sum, item) => sum + item.counts.reactions,
                            );
                          }
                          return _buildStatCard(
                            snapshot.hasData ? "$info" : "-",
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

                // Feed Section Header
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 4,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Posts",
                        style: TextStyle(
                          color: textColor,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        "See All",
                        style: TextStyle(
                          color: _primaryColor,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 10),

                FutureBuilder<List<Post>>(
                  future: _postsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
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
                    final posts = snapshot.data ?? [];
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
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: posts.length,
                      separatorBuilder:
                          (context, index) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final post = posts[index];
                        return _buildFeedItem(
                          context,
                          user: post.author,
                          timeAgo: _timeAgo(post.createdAt),
                          text: post.content ?? '',
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textColor: textColor,
                          isDark: isDark,
                          likes: post.counts.reactions.toString(),
                          comments: post.counts.comments.toString(),
                          child: _buildMediaPreview(post.media, isDark),
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

  Widget _buildMediaPreview(List<PostMedia> media, bool isDark) {
    if (media.isEmpty) return const SizedBox.shrink();
    final first = media.first;

    return Container(
      height: 200,
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[800] : Colors.grey[200],
        image: DecorationImage(
          image: NetworkImage(first.thumbnail ?? first.url),
          fit: BoxFit.cover,
          onError: (_, __) {},
        ),
      ),
      child:
          first.type == 'VIDEO'
              ? const Center(
                child: Icon(
                  Icons.play_circle_fill,
                  size: 48,
                  color: Colors.white,
                ),
              )
              : null,
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

  Widget _buildFeedItem(
    BuildContext context, {
    required dynamic user,
    required String timeAgo,
    required String text,
    required Color cardColor,
    required Color borderColor,
    required Color textColor,
    required bool isDark,
    Widget? child,
    required String likes,
    required String comments,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: cardColor,
        border: Border.all(color: borderColor),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Post Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundImage: NetworkImage(
                    user.profilePicture ??
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuC7cLEx-rRko3eKJNBZfv1q-n02PKnsdDpr4_-5R_WDMow5yLTfoVaM-Y1BNElVINCilmaqa8NQNhBjdk5M_5qkew1YJNU78FjfEMHSokdaLMNABsTPTpju4u6T1huzT9DMCVoyFokgCw74ksB91v04hJcRcnqwEP1I_ANxqlF5M69MltaIkagUHSkt96fOt409StIvCLy8TLVl5iM4MiKfeJZAJgejZnjS6NCf5HSAG2rWmto2dQoJOiN5PoLMX2f4QWKw8Bvehpi3",
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      style: TextStyle(
                        color: textColor,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(
                          "$timeAgo • ",
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 12,
                          ),
                        ),
                        Icon(Icons.public, size: 12, color: Colors.grey[500]),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Post Text
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              text,
              style: TextStyle(
                color: isDark ? Colors.grey[200] : Colors.grey[800],
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ),

          if (child != null) child,

          // Actions
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: isDark ? Colors.grey[800]! : Colors.grey[100]!,
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildActionButton(
                  Icons.thumb_up_outlined,
                  likes,
                  Colors.grey[600],
                  isDark,
                ),
                _buildActionButton(
                  Icons.chat_bubble_outline,
                  comments,
                  Colors.grey[600],
                  isDark,
                ),
                _buildActionButton(
                  Icons.share_outlined,
                  "Share",
                  Colors.grey[600],
                  isDark,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    IconData icon,
    String label,
    Color? color,
    bool isDark,
  ) {
    final finalColor = isDark ? Colors.grey[400] : color;
    return Row(
      children: [
        Icon(icon, size: 20, color: finalColor),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            color: finalColor,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
