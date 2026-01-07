import '../constants/api_constants.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'socket_service.dart';

class AuthService {
  static User? currentUser;
  static const _tokenKey = 'auth_token';
  static const _userKey = 'user_data';

  static Future<void> saveSession(String token, User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));

    // Update local state
    currentUser = user;
    ApiService.setToken(token);
    SocketService().connect(token, user);
  }

  static Future<bool> loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final userData = prefs.getString(_userKey);

    if (token != null && userData != null) {
      try {
        ApiService.setToken(token);
        currentUser = User.fromJson(jsonDecode(userData));
        SocketService().connect(token, currentUser!);
        return true;
      } catch (e) {
        print('Error loading session: $e');
        await clearSession();
        return false;
      }
    }
    return false;
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
    currentUser = null;
    ApiService.setToken(null);
    SocketService().disconnect();
  }

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
