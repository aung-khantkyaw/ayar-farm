import 'package:image_picker/image_picker.dart';
import 'dart:convert';
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

  static Future<Post?> getPost(String id) async {
    try {
      final response = await ApiService.get('${ApiConstants.posts}/$id');
      if (response['data'] != null) {
        return Post.fromJson(response['data']);
      }
    } catch (e) {
      print('Exception fetching post: $e');
    }
    return null;
  }

  static Future<Post?> updatePost({
    required String postId,
    required String content,
    required List<String> tags,
    required List<XFile> files,
    List<PostMedia> existingMedia = const [],
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

      // Keep existing media by sending them back in the payload; removed ones are simply omitted.
      if (existingMedia.isNotEmpty) {
        fields['media'] = jsonEncode(
          existingMedia
              .map(
                (m) => {'url': m.url, 'thumbnail': m.thumbnail, 'type': m.type},
              )
              .toList(),
        );
      }

      final response = await ApiService.putMultipart(
        '${ApiConstants.posts}/$postId',
        fields,
        files: files.isNotEmpty ? {'media': files} : null,
      );

      if (response['data'] != null) {
        return Post.fromJson(response['data']);
      }
    } catch (e) {
      print('Exception updating post: $e');
    }
    return null;
  }
}
