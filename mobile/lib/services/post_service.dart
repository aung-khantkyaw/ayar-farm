import 'package:image_picker/image_picker.dart';
import '../constants/api_constants.dart';
import '../models/post.dart';
import 'api_service.dart';

class PostService {
  static Future<List<Post>> getPosts({String? userId, String? tag}) async {
    try {
      final queryParams = <String, String>{};
      if (userId != null) {
        queryParams['authorId'] = userId;
      }
      if (tag != null) {
        queryParams['tag'] = tag;
      }

      final response = await ApiService.get(
        ApiConstants.posts,
        queryParams: queryParams,
      );

      if (response['data'] != null) {
        return (response['data'] as List)
            .map((json) => Post.fromJson(json))
            .toList();
      }
      return [];
    } catch (e) {
      print('Exception fetching posts: $e');
      return [];
    }
  }

  static Future<bool> createPost({
    required String content,
    required List<String> tags,
    required List<XFile> files,
    String visibility = 'PUBLIC',
  }) async {
    try {
      final fields = <String, String>{
        'content': content,
        'visibility': visibility,
      };

      if (tags.isNotEmpty) {
        fields['tags'] = tags.join(',');
      }

      await ApiService.postMultipart(
        ApiConstants.posts,
        fields,
        files: {
          'media': files, // Pass the list of XFile objects directly
        },
      );

      return true;
    } catch (e) {
      print('Exception creating post: $e');
      return false;
    }
  }
}
