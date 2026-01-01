import '../constants/api_constants.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  static User? currentUser;

  static Future<AuthResponse> register({
    required String name,
    required String phoneNumber,
    String? email,
    required String password,
    required String userType,
  }) async {
    final data = {
      'name': name,
      'phone_number': phoneNumber,
      'email': email,
      'password': password,
      'user_type': userType,
    };
    final response = await ApiService.post(ApiConstants.register, data);
    return AuthResponse.fromJson(response);
  }

  static Future<AuthResponse> login({
    String? phoneNumber,
    String? email,
    required String password,
  }) async {
    final data = {
      if (phoneNumber != null) 'phone_number': phoneNumber,
      if (email != null) 'email': email,
      'password': password,
    };
    final response = await ApiService.post(ApiConstants.login, data);
    return AuthResponse.fromJson(response);
  }

  static Future<AuthResponse> verify({
    String? phoneNumber,
    String? email,
    required String code,
  }) async {
    final data = {'phone_number': phoneNumber, 'email': email, 'code': code};
    final response = await ApiService.post(ApiConstants.verify, data);
    return AuthResponse.fromJson(response);
  }

  static Future<Map<String, dynamic>> resendOTP({
    String? phoneNumber,
    String? email,
  }) async {
    final data = {'phone_number': phoneNumber, 'email': email};
    return await ApiService.post(ApiConstants.resendOtp, data);
  }

  static Future<Map<String, dynamic>> requestPasswordReset({
    String? phoneNumber,
    String? email,
  }) async {
    final data = {'phone_number': phoneNumber, 'email': email};
    return await ApiService.post(ApiConstants.forgotPassword, data);
  }

  static Future<Map<String, dynamic>> resetPassword({
    String? phoneNumber,
    String? email,
    required String code,
    required String newPassword,
  }) async {
    final data = {
      'phone_number': phoneNumber,
      'email': email,
      'code': code,
      'new_password': newPassword,
    };
    return await ApiService.post(ApiConstants.resetPassword, data);
  }

  static Future<AuthResponse> updateAccount(
    Map<String, dynamic> data, {
    String? profilePicturePath,
  }) async {
    Map<String, dynamic> response;
    if (profilePicturePath != null) {
      final fields = data.map(
        (key, value) => MapEntry(key, value?.toString() ?? ''),
      );
      response = await ApiService.putMultipart(
        ApiConstants.updateAccount,
        fields,
        files: {'profile_picture': profilePicturePath},
      );
    } else {
      response = await ApiService.put(ApiConstants.updateAccount, data);
    }
    return AuthResponse.fromJson(response);
  }

  static Future<Map<String, dynamic>> deleteAccount() async {
    return await ApiService.delete(ApiConstants.deleteAccount);
  }
}
