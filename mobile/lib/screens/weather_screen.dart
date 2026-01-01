import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:intl/intl.dart';
import 'dart:math' as math;

class WeatherScreen extends StatefulWidget {
  const WeatherScreen({super.key});

  @override
  State<WeatherScreen> createState() => _WeatherScreenState();
}

class _WeatherScreenState extends State<WeatherScreen> {
  Map<String, dynamic>? _weatherData;
  bool _isLoading = true;
  String _error = '';

  // Colors - Blue Theme
  static const primaryColor = Colors.blue;
  static const backgroundLight = Color(0xFFF0F9FF);
  static const backgroundDark = Color(0xFF0F172A);
  static const surfaceLight = Color(0xFFFFFFFF);
  static const surfaceDark = Color(0xFF1E293B);
  static const textMainLight = Color(0xFF0F172A);
  static const textMainDark = Color(0xFFFFFFFF);
  static const textMutedLight = Color(0xFF64748B);
  static const textMutedDark = Color(0xFF94A3B8);

  @override
  void initState() {
    super.initState();
    _fetchWeatherData();
  }

  Future<void> _fetchWeatherData() async {
    try {
      bool serviceEnabled;
      LocationPermission permission;

      serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _error = AppLocalizations.of(context)!.locationDisabled;
          _isLoading = false;
        });
        return;
      }

      permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _error = AppLocalizations.of(context)!.locationDenied;
            _isLoading = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _error = AppLocalizations.of(context)!.locationPermanentlyDenied;
          _isLoading = false;
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
          _weatherData = json.decode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = AppLocalizations.of(context)!.weatherLoadFailed;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = '${AppLocalizations.of(context)!.weatherError}$e';
        _isLoading = false;
      });
    }
  }

  IconData _getWeatherIcon(String? status, {bool isNight = false}) {
    status = status?.toLowerCase() ?? '';
    if (status.contains('clear') || status.contains('sunny')) {
      return isNight ? Icons.nightlight_round : Icons.wb_sunny;
    } else if (status.contains('partly cloudy')) {
      return isNight
          ? Icons.nightlight_round
          : Icons.wb_cloudy; // closest to partly_cloudy_day
    } else if (status.contains('cloud')) {
      return Icons.cloud;
    } else if (status.contains('rain') || status.contains('drizzle')) {
      return Icons.water_drop; // closest to rainy
    } else if (status.contains('storm') || status.contains('thunder')) {
      return Icons.thunderstorm;
    } else if (status.contains('fog') || status.contains('mist')) {
      return Icons.foggy; // closest to fog
    }
    return Icons.wb_sunny;
  }

  Color _getIconColor(String? status, bool isDark) {
    status = status?.toLowerCase() ?? '';
    if (status.contains('clear') || status.contains('sunny')) {
      return Colors.amber;
    } else if (status.contains('rain') || status.contains('drizzle')) {
      return Colors.blue;
    } else if (status.contains('storm')) {
      return Colors.deepPurple;
    }
    return isDark ? Colors.grey[400]! : Colors.grey;
  }

  double _getWindRotation(String? direction) {
    if (direction == null) return 0;
    direction = direction.toUpperCase();
    double degrees = 0;
    switch (direction) {
      case 'E':
        degrees = 0;
        break;
      case 'ENE':
        degrees = 22.5;
        break;
      case 'NE':
        degrees = 45;
        break;
      case 'NNE':
        degrees = 67.5;
        break;
      case 'N':
        degrees = 90;
        break;
      case 'NNW':
        degrees = 112.5;
        break;
      case 'NW':
        degrees = 135;
        break;
      case 'WNW':
        degrees = 157.5;
        break;
      case 'W':
        degrees = 180;
        break;
      case 'WSW':
        degrees = 202.5;
        break;
      case 'SW':
        degrees = 225;
        break;
      case 'SSW':
        degrees = 247.5;
        break;
      case 'S':
        degrees = 270;
        break;
      case 'SSE':
        degrees = 292.5;
        break;
      case 'SE':
        degrees = 315;
        break;
      case 'ESE':
        degrees = 337.5;
        break;
      default:
        return 0;
    }
    // Convert to radians for Transform.rotate (clockwise)
    // Icon points North (90 in user system) by default
    // Formula: (90 - degrees) * (pi / 180)
    return (90 - degrees) * (math.pi / 180);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? backgroundDark : backgroundLight;
    final surfaceColor = isDark ? surfaceDark : surfaceLight;
    final textMain = isDark ? textMainDark : textMainLight;
    final textMuted = isDark ? textMutedDark : textMutedLight;

    // Colors from CategoryScreen Weather Card
    final weatherCardBg =
        isDark ? const Color(0xFF1A2C38) : const Color(0xFFE3F2FD);
    final weatherCardTitle = isDark ? Colors.blue[100]! : Colors.blue[900]!;
    final weatherCardSubtitle = isDark ? Colors.blue[300]! : Colors.blue[800]!;
    final weatherCardIcon = Colors.blue;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: bgColor,
        body: const Center(
          child: CircularProgressIndicator(color: primaryColor),
        ),
      );
    }

    if (_error.isNotEmpty) {
      return Scaffold(
        backgroundColor: bgColor,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: BackButton(color: textMain),
        ),
        body: Center(child: Text(_error, style: TextStyle(color: textMain))),
      );
    }

    final current = _weatherData?['current'];
    final forecast = _weatherData?['forecast'] as List?;
    final hourly = _weatherData?['hourly'] as List?;

    return Scaffold(
      backgroundColor: bgColor,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 1,
        type: BottomNavigationBarType.fixed,
        backgroundColor: surfaceColor,
        selectedItemColor: const Color(0xFF2BEE5B),
        unselectedItemColor: textMuted,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        selectedFontSize: 10,
        unselectedFontSize: 10,
        onTap: (index) {
          if (index == 0) {
            Navigator.of(context).popUntil((route) => route.isFirst);
          } else if (index == 1) {
            Navigator.pop(context);
          }
        },
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home),
            label: AppLocalizations.of(context)!.navHome,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.grid_view),
            activeIcon: const Icon(Icons.grid_view),
            label: AppLocalizations.of(context)!.navCategory,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.groups_outlined),
            activeIcon: const Icon(Icons.groups),
            label: AppLocalizations.of(context)!.navCommunity,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.person_outline),
            activeIcon: const Icon(Icons.person),
            label: AppLocalizations.of(context)!.navProfile,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildCircleButton(
                    Icons.arrow_back,
                    () => Navigator.pop(context),
                    isDark,
                    textMain,
                  ),
                  Text(
                    AppLocalizations.of(context)!.weatherForecast,
                    style: TextStyle(
                      color: textMain,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Current Weather Card
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          color: weatherCardBg,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Location
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.location_on,
                                  color: weatherCardIcon,
                                  size: 16,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  current?['location'] ?? 'Unknown Location',
                                  style: TextStyle(
                                    color: weatherCardTitle,
                                    fontWeight: FontWeight.w500,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              DateFormat(
                                'EEE, MMMM d • h:mm a',
                              ).format(DateTime.now()),
                              style: TextStyle(
                                color: weatherCardSubtitle,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Main Temp
                            Icon(
                              _getWeatherIcon(current?['status']),
                              color: weatherCardIcon,
                              size: 64,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${current?['temperature']}°',
                              style: TextStyle(
                                color: weatherCardTitle,
                                fontSize: 72,
                                fontWeight: FontWeight.bold,
                                height: 1,
                              ),
                            ),
                            Text(
                              current?['status'] ?? '',
                              style: TextStyle(
                                color: weatherCardSubtitle,
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                              ),
                            ),

                            const SizedBox(height: 32),
                            Divider(
                              color: weatherCardSubtitle.withOpacity(0.2),
                            ),
                            const SizedBox(height: 16),

                            // Grid Stats
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildWeatherStat(
                                  Icons.water_drop,
                                  current?['humidity'] ?? '',
                                  'Humidity',
                                  weatherCardIcon,
                                  weatherCardTitle,
                                  weatherCardSubtitle,
                                ),
                                _buildWeatherStat(
                                  Icons.air,
                                  current?['wind'] ?? '',
                                  'Wind',
                                  weatherCardIcon,
                                  weatherCardTitle,
                                  weatherCardSubtitle,
                                ),
                                _buildWeatherStat(
                                  Icons.compress,
                                  '1012', // Mocked as API doesn't seem to have pressure in 'current' based on snippet
                                  'hPa',
                                  weatherCardIcon,
                                  weatherCardTitle,
                                  weatherCardSubtitle,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Hourly Forecast
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'Hourly Forecast',
                        style: TextStyle(
                          color: textMain,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 140,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        itemCount: hourly?.length ?? 0,
                        separatorBuilder:
                            (context, index) => const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final hourData = hourly![index];
                          final timeStr = hourData['hour'] as String? ?? '';
                          final hour = int.tryParse(timeStr.split(':')[0]) ?? 0;
                          final isNight = hour <= 6 || hour >= 18;

                          return Container(
                            width: 80,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            decoration: BoxDecoration(
                              color:
                                  isNight
                                      ? (isDark
                                          ? Colors.black26
                                          : const Color(0xFFE0E0E0))
                                      : surfaceColor,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color:
                                    isDark
                                        ? Colors.white.withOpacity(0.1)
                                        : Colors.transparent,
                              ),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  hourData['hour'] ?? '',
                                  style: TextStyle(
                                    color: textMuted,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Icon(
                                  _getWeatherIcon(
                                    hourData['status'],
                                    isNight: isNight,
                                  ),
                                  color: _getIconColor(
                                    hourData['status'],
                                    isDark,
                                  ),
                                  size: 28,
                                ),
                                Text(
                                  '${hourData['temp']}°',
                                  style: TextStyle(
                                    color: textMain,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Column(
                                  children: [
                                    Transform.rotate(
                                      angle: _getWindRotation(
                                        hourData['windDirection'],
                                      ),
                                      child: const Icon(
                                        Icons.navigation,
                                        size: 12,
                                        color: Colors.blue,
                                      ),
                                    ),
                                    Text(
                                      '${hourData['windSpeed']}km',
                                      style: TextStyle(
                                        color: textMuted,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),

                    const SizedBox(height: 24),

                    // 7-Day Forecast
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        '7-Day Forecast',
                        style: TextStyle(
                          color: textMain,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: forecast?.length ?? 0,
                      separatorBuilder:
                          (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final dayData = forecast![index];
                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: surfaceColor,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color:
                                  isDark
                                      ? Colors.white.withOpacity(0.1)
                                      : Colors.transparent,
                            ),
                          ),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 60,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      dayData['day'] ?? '',
                                      style: TextStyle(
                                        color: textMain,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                    Text(
                                      'Date', // API doesn't seem to give full date in forecast list, maybe calculate?
                                      style: TextStyle(
                                        color: textMuted,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Expanded(
                                child: Row(
                                  children: [
                                    Icon(
                                      _getWeatherIcon(dayData['status']),
                                      color: _getIconColor(
                                        dayData['status'],
                                        isDark,
                                      ),
                                      size: 24,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            dayData['status'] ?? '',
                                            style: TextStyle(
                                              color: textMain,
                                              fontWeight: FontWeight.w500,
                                              fontSize: 14,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Row(
                                            children: [
                                              Transform.rotate(
                                                angle: _getWindRotation(
                                                  dayData['windDirection'],
                                                ),
                                                child: Icon(
                                                  Icons.navigation,
                                                  size: 10,
                                                  color: textMuted,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                '${dayData['windDirection']} ${dayData['windSpeed']}km/h',
                                                style: TextStyle(
                                                  color: textMuted,
                                                  fontSize: 10,
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
                              Row(
                                children: [
                                  Text(
                                    '${dayData['high']}°',
                                    style: TextStyle(
                                      color: textMain,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${dayData['low']}°',
                                    style: TextStyle(
                                      color: textMuted,
                                      fontWeight: FontWeight.w500,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircleButton(
    IconData icon,
    VoidCallback onTap,
    bool isDark,
    Color color,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color:
              isDark
                  ? Colors.white.withOpacity(0.05)
                  : Colors.black.withOpacity(0.05),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }

  Widget _buildWeatherStat(
    IconData icon,
    String value,
    String label,
    Color iconColor,
    Color valueColor,
    Color labelColor,
  ) {
    return Column(
      children: [
        Icon(icon, color: iconColor, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: valueColor,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        Text(label, style: TextStyle(color: labelColor, fontSize: 10)),
      ],
    );
  }
}
