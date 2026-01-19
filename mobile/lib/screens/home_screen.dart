import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../widgets/common_header.dart';
import 'weather_screen.dart';
import '../services/post_service.dart';
import '../models/post.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _weather;
  bool _isLoadingWeather = true;
  String _locationError = '';
  late Future<List<Post>> _postsFuture;
  String _selectedCategory = 'All';

  final List<String> _availableHashtags = [
    "ကောက်ပဲသီးနှံများ",
    "ခြံမွေးတိရစ္ဆာန်များ",
    "ငါးလုပ်ငန်း",
    "လယ်ယာသုံးစက်ကိရိယာများ",
    "မိုးလေဝသ",
    "ပေါက်ဈေး",
  ];

  @override
  void initState() {
    super.initState();
    _fetchWeather();
    _loadPosts();
  }

  void _loadPosts() {
    _postsFuture = PostService.getPosts(
      tag: _selectedCategory == 'All' ? null : _selectedCategory,
    );
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
          'https://getweatherbycityapi.laziestant.tech/v2/weather?lat=${position.latitude}&lon=${position.longitude}',
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
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
                                          style: TextStyle(color: textSubColor),
                                        ),
                                      )
                                      : Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
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
                                                    )!.currentLocation, // API doesn't seem to return city name in the snippet provided
                                                    style: TextStyle(
                                                      color: textSubColor,
                                                      fontSize: 14,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 4),
                                                  Text(
                                                    '${_weather!['current']['temperature']}°${_weather!['current']['unit'] ?? 'C'}',
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
                                                              .withOpacity(0.2)
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

                    // Search Bar
                    TextField(
                      style: TextStyle(color: textMainColor),
                      decoration: InputDecoration(
                        hintText:
                            AppLocalizations.of(context)!.searchPlaceholder,
                        hintStyle: TextStyle(color: textSubColor),
                        filled: true,
                        fillColor: surfaceColor,
                        prefixIcon: Icon(Icons.search, color: textSubColor),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 16,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: primaryColor,
                            width: 2,
                          ),
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

                    // Community Feed
                    Text(
                      AppLocalizations.of(context)!.communityFeed,
                      style: TextStyle(
                        color: textMainColor,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),

                    FutureBuilder<List<Post>>(
                      future: _postsFuture,
                      builder: (context, snapshot) {
                        if (snapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        }
                        if (snapshot.hasError) {
                          return Center(
                            child: Text(
                              'Error loading posts',
                              style: TextStyle(color: textSubColor),
                            ),
                          );
                        }
                        final posts = snapshot.data ?? [];
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
                            return _buildPostCard(
                              context,
                              surfaceColor,
                              borderColor,
                              textMainColor,
                              textSubColor,
                              primaryColor,
                              post.author.name,
                              _timeAgo(post.createdAt),
                              post.author.profilePicture ??
                                  "https://lh3.googleusercontent.com/aida-public/AB6AXuC7cLEx-rRko3eKJNBZfv1q-n02PKnsdDpr4_-5R_WDMow5yLTfoVaM-Y1BNElVINCilmaqa8NQNhBjdk5M_5qkew1YJNU78FjfEMHSokdaLMNABsTPTpju4u6T1huzT9DMCVoyFokgCw74ksB91v04hJcRcnqwEP1I_ANxqlF5M69MltaIkagUHSkt96fOt409StIvCLy8TLVl5iM4MiKfeJZAJgejZnjS6NCf5HSAG2rWmto2dQoJOiN5PoLMX2f4QWKw8Bvehpi3",
                              post.content ?? '',
                              imageUrl:
                                  post.media.isNotEmpty
                                      ? (post.media.first.thumbnail ??
                                          post.media.first.url)
                                      : null,
                              tag:
                                  post.tags.isNotEmpty ? post.tags.first : null,
                              likes: post.counts.reactions.toString(),
                              comments:
                                  "${post.counts.comments} ${AppLocalizations.of(context)!.comments}",
                            );
                          },
                        );
                      },
                    ),
                  ],
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
              onPressed: () {},
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

  Widget _buildPostCard(
    BuildContext context,
    Color surface,
    Color border,
    Color textMain,
    Color textSub,
    Color primary,
    String author,
    String time,
    String avatarUrl,
    String content, {
    String? imageUrl,
    String? tag,
    required String likes,
    required String comments,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundImage: NetworkImage(avatarUrl),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        author,
                        style: TextStyle(
                          color: textMain,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        time,
                        style: TextStyle(color: textSub, fontSize: 12),
                      ),
                    ],
                  ),
                ],
              ),
              Icon(Icons.more_horiz, color: textSub),
            ],
          ),
          const SizedBox(height: 12),
          if (tag != null)
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: primary.withOpacity(0.2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                tag,
                style: TextStyle(
                  color: const Color(0xFF052E11), // primary-content
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          Text(
            content,
            style: TextStyle(color: textMain, fontSize: 16, height: 1.5),
          ),
          if (imageUrl != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                imageUrl,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Divider(color: border, height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.thumb_up_outlined, size: 20, color: textSub),
                  const SizedBox(width: 8),
                  Text(
                    likes,
                    style: TextStyle(
                      color: textSub,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  Icon(Icons.chat_bubble_outline, size: 20, color: textSub),
                  const SizedBox(width: 8),
                  Text(
                    comments,
                    style: TextStyle(
                      color: textSub,
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
