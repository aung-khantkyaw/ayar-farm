import '../constants/api_constants.dart';
import '../models/user.dart';
import 'api_service.dart';

class UserService {
  static Future<User?> getUserById(String id) async {
    try {
      final response = await ApiService.get('${ApiConstants.users}/$id');
      if (response['data'] != null) {
        return User.fromJson(response['data']);
      }
      return null;
    } catch (e) {
      print('Error fetching user: $e');
      return null;
    }
  }
}
