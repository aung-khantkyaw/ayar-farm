import 'package:ayar_farm/screens/create_post_screen.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../widgets/common_header.dart';
import '../widgets/common_post_card.dart';
import 'weather_screen.dart';
import 'profile_screen.dart';
import '../services/post_service.dart';
import '../services/auth_service.dart';
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
                            return CommonPostCard(
                              surfaceColor: surfaceColor,
                              borderColor: borderColor,
                              textMainColor: textMainColor,
                              textSubColor: textSubColor,
                              primaryColor: primaryColor,
                              authorName: post.author.name,
                              timeAgo: _timeAgo(post.createdAt),
                              authorAvatarUrl:
                                  post.author.profilePicture ??
                                  "https://lh3.googleusercontent.com/aida-public/AB6AXuA9ewvkffzPg2DVJEM93D25jdhjC8Kq4BSClkdT7GiLz1Dqs3YYXiMNVU4RYXGTjXSsjkX84yOspLDkfZw0_9QkI32lCjtP3IdMwBh7mp7kY4ZDf_F7MgQEQG3i8yUwPsyzoPkJ15LyL60egXLznpCpABaqmB98USnmyujPPjvaBNKCfnkVBGkYkkXpkIGYFliuTuTDdzmBiSVIv0cb5wqfK3FkSRF2ANWJ-_T6Qfjthaqv9Kktq_XqHpfvbbZ5CEyi3m-0FlRZ4SgU",
                              content: post.content ?? '',
                              imageUrl:
                                  post.media.isNotEmpty
                                      ? (post.media.first.thumbnail ??
                                          post.media.first.url)
                                      : null,
                              tag:
                                  post.tags.isNotEmpty ? post.tags.first : null,
                              likesCount: post.counts.reactions.toString(),
                              commentsCount:
                                  "${post.counts.comments} ${AppLocalizations.of(context)!.comments}",
                              isCurrentUser:
                                  post.author.id == AuthService.currentUser?.id,
                              userType: post.author.userType,
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
