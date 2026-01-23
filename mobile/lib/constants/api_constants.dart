import 'package:flutter/foundation.dart';

class ApiConstants {
  static String _resolveBaseUrl() {
    const env = String.fromEnvironment('API_BASE_URL');
    if (env.isNotEmpty) return env;

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      // Android emulator cannot reach host's localhost; 10.0.2.2 points to host.
      return 'http://10.0.2.2:3000/api';
    }

    return 'http://localhost:3000/api';
  }

  static final String baseUrl = _resolveBaseUrl();

  // Auth endpoints
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String verify = '/auth/verify';
  static const String resendOtp = '/auth/resend-otp';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String updateAccount = '/auth/update';
  static const String deleteAccount = '/auth/delete';

  // User endpoints
  static const String users = '/users';

  // Crop endpoints
  static const String cropTypes = '/cropsandpulses/croptypes';
  static const String crops = '/cropsandpulses/crops';

  // Fish endpoints
  static const String fishs = '/fishery/fishs';

  // Livestock endpoints
  static const String livestocks = '/livestockindustry/livestocks';

  // Machine endpoints
  static const String machinetypes = '/agriindustry/machinetypes';
  static const String machines = '/agriindustry/machines';

  // Document endpoints
  static const String documents = '/document/documents';

  // Post endpoints
  static const String getPostsByUser = '/posts/user';
  static const String posts = '/post/posts';
}
