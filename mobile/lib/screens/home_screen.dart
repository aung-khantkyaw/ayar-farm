import 'package:ayar_farm/screens/create_post_screen.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/api_service.dart';
import 'package:intl/intl.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../widgets/common_header.dart';
import '../widgets/common_post_card.dart';
import '../widgets/announcement_card.dart';
import 'weather_screen.dart';
import 'profile_screen.dart';
import '../services/post_service.dart';
import '../services/auth_service.dart';
import '../models/post.dart';
import '../services/socket_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  FlutterLocalNotificationsPlugin? _localNotifications;
  Map<String, dynamic>? _weather;
  bool _isLoadingWeather = true;
  String _locationError = '';
  late Future<List<Post>> _postsFuture;
  List<Post> _livePosts = [];
  String _selectedCategory = 'All';
  void Function(dynamic)? _postReactionListener;
  void Function(dynamic)? _postCommentListener;
  void Function(dynamic)? _postCommentDeletedListener;
  final ScrollController _scrollController = ScrollController();
  bool _showScrollToTop = false;
  bool _isScrollToTopInProgress = false;

  // Announcement state
  Map<String, dynamic>? _activeAnnouncement;
  bool _showAnnouncement = true;

  final List<String> _availableHashtags = [
    "ကောက်ပဲသီးနှံများ",
    "ခြံမွေးတိရစ္ဆာန်များ",
    "ငါးလုပ်ငန်း",
    "လယ်ယာသုံးစက်ကိရိယာများ",
    "မိုးလေဝသ",
    "ပေါက်ဈေး",
    "စိုက်ပျိုးရေးနည်းပညာများ",
    "သစ်တောစိုက်ပျိုးရေး",
    "မြေညီပင်စိုက်ပျိုးရေး",
    "မြေသြဇာနှင့်ဓာတုသယံဇာ",
    "ဆေးပင်များနှင့်အပင်များ",
    "အပင်ကာကွယ်ဆေးများ",
    "အရောင်းအဝယ်ဈေးကွက်",
    "အဆောက်အအုံများ",
    "အိမ်မွေးတိရစ္ဆာန်ကျန်းမာရေး",
    "ချေးငွေ",
  ];

  @override
  void initState() {
    super.initState();
    _initLocalNotifications();
    _refreshAll();
    _setupRealtime();
    _scrollController.addListener(_handleScroll);
    _fetchActiveAnnouncement();
    _startAnnouncementPolling();
  }

  void _initLocalNotifications() async {
    _localNotifications = FlutterLocalNotificationsPlugin();
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings();
    await _localNotifications!.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );

    // Create notification channel for Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'announcement_channel',
      'Announcements',
      description: 'Channel for announcements',
      importance: Importance.max,
    );
    await _localNotifications!
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(channel);

    // Request permission for Android 13+
    await _localNotifications!
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();
  }

  void _showLocalAnnouncementNotification(
    Map<String, dynamic> announcement,
  ) async {
    if (_localNotifications == null) return;
    const android = AndroidNotificationDetails(
      'announcement_channel',
      'Announcements',
      importance: Importance.max,
      priority: Priority.high,
    );
    const ios = DarwinNotificationDetails();
    const details = NotificationDetails(android: android, iOS: ios);
    await _localNotifications!.show(
      0,
      announcement['title'] ?? 'Announcement',
      announcement['message'] ?? '',
      details,
    );
  }

  // Poll every 10 seconds for announcement changes
  void _startAnnouncementPolling() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 10));
      if (!mounted) return false;
      await _fetchActiveAnnouncement(realTime: true);
      return mounted;
    });
  }

  Future<void> _fetchActiveAnnouncement({bool realTime = false}) async {
    final currentUser = AuthService.currentUser;
    if (currentUser == null) return;
    try {
      // Fetch announcements that are active and either have no specific recipients
      // or the current user is among the recipients
      final response = await ApiService.get(
        '/announcements',
        queryParams: {'active': 'true', 'userId': currentUser.id},
      );
      final announcements = response['data'] as List?;

      // Since the server already filters for active and user-specific announcements
      final newAnnouncement =
          (announcements != null && announcements.isNotEmpty)
              ? announcements.first
              : null;

      debugPrint('Filtered announcements count: ${announcements?.length}');
      debugPrint('New announcement: ${newAnnouncement?['title']}');
      debugPrint(
        '_activeAnnouncement before: ${_activeAnnouncement?['title']}',
      );
      debugPrint('_showAnnouncement before: $_showAnnouncement');

      final prevId = _activeAnnouncement?['id'];
      final newId = newAnnouncement?['id'];
      if (newAnnouncement != null) {
        debugPrint('Processing new announcement with ID: $newId');
        if (realTime && prevId != newId) {
          _showLocalAnnouncementNotification(newAnnouncement);
        }
        setState(() {
          _activeAnnouncement = newAnnouncement;
          _showAnnouncement = true;
        });
      } else {
        debugPrint('No active announcement found, hiding card');
        setState(() {
          _activeAnnouncement = null;
          _showAnnouncement = false;
        });
      }
      debugPrint('_activeAnnouncement after: ${_activeAnnouncement?['title']}');
      debugPrint('_showAnnouncement after: $_showAnnouncement');
    } catch (e) {
      debugPrint('Error fetching active announcements: $e');
      setState(() {
        _activeAnnouncement = null;
        _showAnnouncement = false;
      });
    }
  }

  Future<void> _loadPosts() async {
    final future = PostService.getPosts(
      tag: _selectedCategory == 'All' ? null : _selectedCategory,
    );
    setState(() {
      _postsFuture = future;
    });
    final posts = await future;
    if (mounted) {
      setState(() {
        _livePosts = posts;
      });
    }
  }

  Future<void> _refreshAll() async {
    await Future.wait([_fetchWeather(), _loadPosts()]);
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

    // Listen for announcement events (requires backend to emit these events)
    socket.on('announcement:updated', (data) {
      _fetchActiveAnnouncement(realTime: true);
    });
    socket.on('announcement:deleted', (data) {
      _fetchActiveAnnouncement(realTime: true);
    });
    // Listen for announcement notification when device token is missing
    socket.on('announcement_notification_missing_token', (data) {
      _fetchActiveAnnouncement(realTime: true);
      // Show local notification as fallback
      _showLocalAnnouncementNotification({
        'title': data['title'] ?? 'New Announcement',
        'message': data['message'] ?? 'An announcement has been published',
      });
    });
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

  Future<void> _fetchWeather() async {
    try {
      bool serviceEnabled;
      LocationPermission permission;

      // Test if location services are enabled.
      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _locationError = AppLocalizations.of(context)!.locationDisabled;
          _isLoadingWeather = false;
        });
        return;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _locationError = AppLocalizations.of(context)!.locationDenied;
            _isLoadingWeather = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _locationError =
              AppLocalizations.of(context)!.locationPermanentlyDenied;
          _isLoadingWeather = false;
        });
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      final response = await http.get(
        Uri.parse(
          'https://getweatherbycity.vercel.app/v2/weather?lat=${position.latitude}&lon=${position.longitude}',
        ),
      );

      if (response.statusCode == 200) {
        setState(() {
          _weather = json.decode(response.body);
          _isLoadingWeather = false;
        });
      } else {
        setState(() {
          _locationError = AppLocalizations.of(context)!.weatherLoadFailed;
          _isLoadingWeather = false;
        });
      }
    } catch (e) {
      setState(() {
        _locationError = '${AppLocalizations.of(context)!.weatherError}$e';
        _isLoadingWeather = false;
      });
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
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _handleScroll() {
    final shouldShow = _scrollController.offset > 300;
    if (shouldShow != _showScrollToTop) {
      setState(() => _showScrollToTop = shouldShow);
    }
  }

  Future<void> _scrollToTop() async {
    if (_isScrollToTopInProgress) return;
    setState(() => _isScrollToTopInProgress = true);
    try {
      await _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeOut,
      );
      await _refreshAll();
    } finally {
      if (mounted) {
        setState(() => _isScrollToTopInProgress = false);
      }
    }
  }

  void _handlePostReactionEvent(dynamic data) {
    if (data == null) return;
    final postId = data['postId']?.toString();
    if (postId == null) return;
    final action = data['action']?.toString();
    final userId = data['userId']?.toString();
    // Skip applying socket counts for the actor; their local optimistic update already handled it.
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

  AnnouncementType _parseAnnouncementType(String? type) {
    switch (type) {
      case 'WARNING':
        return AnnouncementType.warning;
      case 'BREAKING_NEWS':
        return AnnouncementType.breakingNews;
      case 'INFORMATION':
      default:
        return AnnouncementType.information;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Colors from HTML design
    const primaryColor = Color(0xFF2BEE5B);
    const primaryContentColor = Color(0xFF052E11);
    final surfaceColor =
        isDark ? const Color(0xFF1A2C1E) : const Color(0xFFFFFFFF);
    final textMainColor =
        isDark ? const Color(0xFFFFFFFF) : const Color(0xFF111813);
    final textSubColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);
    final borderColor =
        isDark ? Colors.white.withOpacity(0.1) : const Color(0xFFE5E7EB);

    return Stack(
      children: [
        // Main Content
        Column(
          children: [
            const CommonHeader(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _refreshAll,
                child: SingleChildScrollView(
                  controller: _scrollController,
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Announcement Card (if any)
                      if (_activeAnnouncement != null && _showAnnouncement)
                        AnnouncementCard(
                          title: _activeAnnouncement!["title"] ?? '',
                          message: _activeAnnouncement!["message"] ?? '',
                          type: _parseAnnouncementType(
                            _activeAnnouncement!["type"],
                          ),
                          onClose: () {
                            setState(() {
                              _showAnnouncement = false;
                            });
                          },
                        ),

                      // Weather Widget
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const WeatherScreen(),
                            ),
                          );
                        },
                        child: Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: borderColor),
                            boxShadow: [
                              if (!isDark)
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.05),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                            ],
                          ),
                          child: Stack(
                            children: [
                              Positioned(
                                top: -32,
                                right: -32,
                                child: Container(
                                  width: 128,
                                  height: 128,
                                  decoration: BoxDecoration(
                                    color: primaryColor.withOpacity(0.2),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(20),
                                child:
                                    _isLoadingWeather
                                        ? const Center(
                                          child: CircularProgressIndicator(),
                                        )
                                        : _weather == null
                                        ? Center(
                                          child: Text(
                                            _locationError.isNotEmpty
                                                ? _locationError
                                                : AppLocalizations.of(
                                                  context,
                                                )!.weatherUnavailable,
                                            style: TextStyle(
                                              color: textSubColor,
                                            ),
                                          ),
                                        )
                                        : Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      AppLocalizations.of(
                                                        context,
                                                      )!.currentLocation,
                                                      style: TextStyle(
                                                        color: textSubColor,
                                                        fontSize: 14,
                                                        fontWeight:
                                                            FontWeight.w500,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      "${_weather!['current']['temperature']}°${_weather!['current']['unit'] ?? 'C'}",
                                                      style: TextStyle(
                                                        color: textMainColor,
                                                        fontSize: 30,
                                                        fontWeight:
                                                            FontWeight.bold,
                                                      ),
                                                    ),
                                                    Text(
                                                      _weather!['current']['status'] ??
                                                          AppLocalizations.of(
                                                            context,
                                                          )!.unknown,
                                                      style: TextStyle(
                                                        color: textMainColor,
                                                        fontWeight:
                                                            FontWeight.w500,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                Container(
                                                  width: 48,
                                                  height: 48,
                                                  decoration: BoxDecoration(
                                                    color:
                                                        isDark
                                                            ? Colors.blue
                                                                .withOpacity(
                                                                  0.2,
                                                                )
                                                            : Colors.blue[50],
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: const Icon(
                                                    Icons.wb_sunny_outlined,
                                                    color: Colors.blue,
                                                    size: 28,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 16),
                                            Divider(
                                              color: borderColor,
                                              height: 1,
                                            ),
                                            const SizedBox(height: 16),
                                            Row(
                                              children: [
                                                Icon(
                                                  Icons.water_drop_outlined,
                                                  size: 18,
                                                  color: textSubColor,
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  _weather!['current']['humidity'] ??
                                                      '--%',
                                                  style: TextStyle(
                                                    color: textMainColor,
                                                    fontSize: 14,
                                                  ),
                                                ),
                                                const SizedBox(width: 24),
                                                Icon(
                                                  Icons.air,
                                                  size: 18,
                                                  color: textSubColor,
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  _weather!['current']['wind'] ??
                                                      '-- km/h',
                                                  style: TextStyle(
                                                    color: textMainColor,
                                                    fontSize: 14,
                                                  ),
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

                      const SizedBox(height: 24),
                      // Categories
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        clipBehavior: Clip.none,
                        child: Row(
                          children: [
                            _buildCategoryItem(
                              context,
                              id: 'All',
                              label: AppLocalizations.of(context)!.catAll,
                              primaryColor: primaryColor,
                              primaryContentColor: primaryContentColor,
                              surfaceColor: surfaceColor,
                              textMainColor: textMainColor,
                              borderColor: borderColor,
                            ),
                            ..._availableHashtags.map(
                              (tag) => Padding(
                                padding: const EdgeInsets.only(left: 12),
                                child: _buildCategoryItem(
                                  context,
                                  id: tag,
                                  label: tag,
                                  primaryColor: primaryColor,
                                  primaryContentColor: primaryContentColor,
                                  surfaceColor: surfaceColor,
                                  textMainColor: textMainColor,
                                  borderColor: borderColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 24),

                      FutureBuilder<List<Post>>(
                        future: _postsFuture,
                        builder: (context, snapshot) {
                          if (snapshot.hasError) {
                            return Center(
                              child: Text(
                                'Error loading posts',
                                style: TextStyle(color: textSubColor),
                              ),
                            );
                          }
                          if (snapshot.connectionState ==
                                  ConnectionState.waiting &&
                              _livePosts.isEmpty) {
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          }

                          final posts =
                              _livePosts.isNotEmpty
                                  ? _livePosts
                                  : (snapshot.data ?? []);
                          if (posts.isEmpty) {
                            return Center(
                              child: Text(
                                'No posts yet',
                                style: TextStyle(color: textSubColor),
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
                                surfaceColor: surfaceColor,
                                borderColor: borderColor,
                                textMainColor: textMainColor,
                                textSubColor: textSubColor,
                                primaryColor: primaryColor,
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
                                tag:
                                    post.tags.isNotEmpty
                                        ? post.tags.first
                                        : null,
                                likesCount: post.counts.reactions.toString(),
                                commentsCount: post.counts.comments.toString(),
                                isCurrentUser:
                                    post.author.id ==
                                    AuthService.currentUser?.id,
                                userType: post.author.userType,
                                reacted: reacted,
                                reactionType: reactionType,
                                onProfileTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder:
                                          (context) => ProfileScreen(
                                            userId: post.author.id,
                                          ),
                                    ),
                                  );
                                },
                              );
                            },
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),

        // Floating Action Button
        Positioned(
          bottom: 90, // Above bottom nav
          right: 16,
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: primaryColor,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: primaryColor.withOpacity(0.4),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: IconButton(
              icon: const Icon(Icons.add, color: primaryContentColor),
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreatePostScreen()),
                );
                if (result == true) {
                  setState(() {
                    _loadPosts();
                  });
                }
              },
            ),
          ),
        ),

        if (_showScrollToTop)
          Positioned(
            bottom: 160,
            right: 16,
            child: Material(
              color: primaryColor,
              shape: const CircleBorder(),
              elevation: 4,
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: _scrollToTop,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child:
                      _isScrollToTopInProgress
                          ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation(
                                primaryContentColor,
                              ),
                            ),
                          )
                          : const Icon(
                            Icons.arrow_upward,
                            color: primaryContentColor,
                            size: 20,
                          ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildCategoryItem(
    BuildContext context, {
    required String id,
    required String label,
    required Color primaryColor,
    required Color primaryContentColor,
    required Color surfaceColor,
    required Color textMainColor,
    required Color borderColor,
  }) {
    final isSelected = _selectedCategory == id;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedCategory = id;
          _loadPosts();
        });
      },
      child: _buildCategoryChip(
        label,
        isSelected,
        primaryColor,
        primaryContentColor,
        surfaceColor,
        textMainColor,
        borderColor,
      ),
    );
  }

  Widget _buildCategoryChip(
    String label,
    bool isSelected,
    Color primary,
    Color primaryContent,
    Color surface,
    Color textMain,
    Color border,
  ) {
    return Container(
      height: 36,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isSelected ? primary : surface,
        borderRadius: BorderRadius.circular(8),
        border: isSelected ? null : Border.all(color: border),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? primaryContent : textMain,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
      ),
    );
  }
}
