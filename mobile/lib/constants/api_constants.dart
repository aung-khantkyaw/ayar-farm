class ApiConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3000/api',
  );

  // Auth endpoints
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String verify = '/auth/verify';
  static const String resendOtp = '/auth/resend-otp';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String updateAccount = '/auth/update';
  static const String deleteAccount = '/auth/delete';

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
