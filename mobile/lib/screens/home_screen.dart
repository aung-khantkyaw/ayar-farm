import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:ayar_farm/l10n/app_localizations.dart';
import '../widgets/common_header.dart';
import 'weather_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? _weather;
  bool _isLoadingWeather = true;
  String _locationError = '';

  @override
  void initState() {
    super.initState();
    _fetchWeather();
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
                          _buildCategoryChip(
                            AppLocalizations.of(context)!.catAll,
                            true,
                            primaryColor,
                            primaryContentColor,
                            surfaceColor,
                            textMainColor,
                            borderColor,
                          ),
                          const SizedBox(width: 12),
                          _buildCategoryChip(
                            AppLocalizations.of(context)!.catPestControl,
                            false,
                            primaryColor,
                            primaryContentColor,
                            surfaceColor,
                            textMainColor,
                            borderColor,
                          ),
                          const SizedBox(width: 12),
                          _buildCategoryChip(
                            AppLocalizations.of(context)!.catIrrigation,
                            false,
                            primaryColor,
                            primaryContentColor,
                            surfaceColor,
                            textMainColor,
                            borderColor,
                          ),
                          const SizedBox(width: 12),
                          _buildCategoryChip(
                            AppLocalizations.of(context)!.catOrganic,
                            false,
                            primaryColor,
                            primaryContentColor,
                            surfaceColor,
                            textMainColor,
                            borderColor,
                          ),
                          const SizedBox(width: 12),
                          _buildCategoryChip(
                            AppLocalizations.of(context)!.catLivestock,
                            false,
                            primaryColor,
                            primaryContentColor,
                            surfaceColor,
                            textMainColor,
                            borderColor,
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

                    // Post 1
                    _buildPostCard(
                      context,
                      surfaceColor,
                      borderColor,
                      textMainColor,
                      textSubColor,
                      primaryColor,
                      'GreenThumb',
                      '2h ago • Question',
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuB5Dpr0VSjxHC9Ba604an-xdmRuFw9z6zR16ai4JidPsokqe1kKbPzbmpWDc7CnSG8mNlmrcOka0wFH8NukPPSknTUDflmTOFzGHxtOs4xbZUQiqF899TM_Oc7H4lgD5IUhO4OSSnndIjnuNyMjgvzjT-2cAmZUCM14BUWH2berBTQbQ-aMgn-g-sapx3Ror_75fqyPdNan0NGrMfEHrE7TYSERPZkm2fSsbSEU1kj9i7V8YawOeboYHLsqBrfdpW6Zy2cwcdfHaNcx',
                      "What's the best organic pesticide for tomato blight? My plants are looking spotty and I want to save them before harvest!",
                      imageUrl:
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuDC0TDG_GOaM8D4epOu6jd93DwAaf1VAXEmC_oMU-jcRPx9pOIyodHBiDjMfzn4DYQCez656aEW2pk625HwPqc_2gB2PjuQt0NsS4cosGE_1BWoslHL0-SsKzsteQ3MPtHJUMoZrYpNEwiVrCCiRXZh3rqpQ-9ucw68qK4HiZ26gRoEorLeeUvXrd1ADGDwYwFoEVxy7ydcyjK-IdRS7AVtu_9TwRLDjU1d1Nj_KQGd1xAHgujmLK9ZPva0fFdJAKu2bE2Mg9rlLjyn',
                      likes: '124',
                      comments: '45 ${AppLocalizations.of(context)!.comments}',
                    ),
                    const SizedBox(height: 16),

                    // Post 2
                    _buildPostCard(
                      context,
                      surfaceColor,
                      borderColor,
                      textMainColor,
                      textSubColor,
                      primaryColor,
                      'AgriExpert',
                      '5h ago • Pro Tip',
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuDII8r8iNDOfeqwaOn9JRhxQVENfVstBW4BidXSRK76gUlmT5wbpsy1so_6_-P4CyMn0OAQ5SFLm255GoUiQV1qw6toa4HrSbz8dT3Ix0vW7qG3TZbqBNzpLX--fy-rZWaepN7-4RswUXtAIw6LgqGx21gcMMyRD6vTysnrA4xbNBp2meKRUyD4Bg21JSDm0tsQ4mXRaqYcm4IkF-7VQqcENDMa-l8fPiJege574TXxXszLjpCV-PObEERuK1IHPCEuC-EGUX3gol9y',
                      "Remember to rotate your crops every season. Planting the same crop in the same spot encourages pest buildup and depletes specific nutrients. Try legumes after corn! 🌽➡️🫘",
                      tag: 'SOIL HEALTH',
                      likes: '856',
                      comments: '12 ${AppLocalizations.of(context)!.comments}',
                    ),
                    const SizedBox(height: 16),

                    // Post 3
                    _buildPostCard(
                      context,
                      surfaceColor,
                      borderColor,
                      textMainColor,
                      textSubColor,
                      primaryColor,
                      'SarahFields',
                      '1d ago • Harvest',
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHQ999w9jvA-_vPDRO1MLihV6kwHZonGV0EnVAWzV1gvXHO8hjH1tN3bHCTn0l_FC5J5kuUDwJRRhd1VLhZKDSHvKLrjG3z9N1e9Z7QLg3ZLutt_d8yhC2N2nuOAKJNxllJBlwmKvQGwckLPOwd4GYL_3Ucv0_tXbTCOZtlCepGnqU_lLzHxCjYBBqgteLWZErGJ15LTp2kBQXptsdbrjxUV6Xf7fcexAeD9e7uPGivNMxuF0z9spdXAKYOIjU81yneoegJyIH-sFA',
                      "First pumpkin harvest of the year looks promising! 🎃",
                      imageUrl:
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuAKr3T-T6YWnnuCIovWlpEstig0AQfE9DDAoOUdvq5zo7reuDzSHCu_1iO1iR9h1DcpD7rEwojXfDtNGHgGJAQCGJCfHc2kwnmyCy0tzfh96JP5ioS4JnMnM_0L9EcrgYNj1k42W4E07nth9KqnclcTHDinOp47Wl-aVOT8xxYoR59ixGgGhFPFsche4OJDxrjwZ4La1wzTCGFT5m4HDEOUTH2QdWzO84spBzbodIce-PlUQSeW5Qt2sUvEEv-4jf9Qz68Cd5lvzMh9',
                      likes: '2.1k',
                      comments: '89 ${AppLocalizations.of(context)!.comments}',
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
              Icon(Icons.share_outlined, size: 20, color: textSub),
            ],
          ),
        ],
      ),
    );
  }
}
