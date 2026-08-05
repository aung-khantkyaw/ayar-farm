class User {
  final String id;
  final String name;
  final String? phoneNumber;
  final String? email;
  final String? gender;
  final String? userType; // Changed to nullable
  final String? profilePicture;
  final String? location;
  final bool isVerified;
  final DateTime? lastLogin;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.name,
    this.phoneNumber,
    this.email,
    this.gender,
    this.userType, // Changed to nullable
    this.profilePicture,
    this.location,
    required this.isVerified,
    this.lastLogin,
    this.createdAt,
    this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    try {
      return User(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        phoneNumber: json['phone_number']?.toString(),
        email: json['email']?.toString(),
        gender: json['gender']?.toString(),
        userType: json['user_type']?.toString() ?? json['userType']?.toString(),
        profilePicture:
            json['profile_picture']?.toString() ??
            json['profilePicture']?.toString(),
        location: json['location']?.toString(),
        isVerified: json['isVerified'] ?? false,
        lastLogin: DateTime.tryParse(json['last_login']?.toString() ?? ''),
        createdAt: DateTime.tryParse(json['created_at']?.toString() ?? ''),
        updatedAt: DateTime.tryParse(json['updated_at']?.toString() ?? ''),
      );
    } catch (e) {
      print('Error parsing User: $e');
      print('JSON: $json');
      rethrow;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone_number': phoneNumber,
      'email': email,
      'gender': gender,
      'user_type': userType,
      'profile_picture': profilePicture,
      'location': location,
      'isVerified': isVerified,
      'last_login': lastLogin?.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}

class AuthResponse {
  final String message;
  final User? user;
  final String? token;

  AuthResponse({required this.message, this.user, this.token});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      message: json['message']?.toString() ?? '',
      user:
          json['data']?['user'] != null
              ? User.fromJson(Map<String, dynamic>.from(json['data']['user']))
              : null,
      token: json['data']?['token']?.toString(),
    );
  }
}
