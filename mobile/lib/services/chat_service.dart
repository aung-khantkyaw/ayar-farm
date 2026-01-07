import 'dart:convert';
import 'api_service.dart';
import '../models/chat_models.dart';

class ChatService {
  Future<List<Conversation>> getConversations() async {
    final response = await ApiService.get('/chat/conversations');

    if (response['data'] != null) {
      return (response['data'] as List)
          .map((e) => Conversation.fromJson(e))
          .toList();
    }
    return [];
  }

  Future<Conversation> getConversation(String id) async {
    final response = await ApiService.get('/chat/conversations/$id');
    if (response['data'] != null) {
      return Conversation.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Failed to load conversation');
  }

  Future<Conversation> createDirectConversation(String userId) async {
    final response = await ApiService.post('/chat/conversations/direct', {
      'participantId': userId,
    });
    if (response['data'] != null) {
      return Conversation.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Failed to create conversation');
  }

  Future<Conversation> createGroupConversation(
    String name,
    List<String> participantIds,
    String? imagePath,
  ) async {
    final fields = {'name': name, 'participantIds': jsonEncode(participantIds)};

    Map<String, String>? files;
    if (imagePath != null) {
      files = {
        'file': imagePath,
      }; // Multer expects field name 'files' or something?
      // Controller: const files = (req as any).files as Express.Multer.File[];
      // uploadImage.any() is used in router. So any field name works or 'file'?
      // ChatController says: const imageUrl = files && files.length > 0 ? files[0].path : undefined;
      // So any field name is fine if it is 'any()'. I'll use 'file'.
    }

    final response = await ApiService.postMultipart(
      '/chat/conversations/group',
      fields,
      files: files,
    );
    if (response['data'] != null) {
      return Conversation.fromJson(response['data']);
    }
    throw Exception(response['message'] ?? 'Failed to create group');
  }

  Future<List<Message>> getMessages(String conversationId) async {
    final response = await ApiService.get(
      '/chat/conversations/$conversationId/messages',
    );
    if (response['data'] != null) {
      return (response['data'] as List)
          .map((e) => Message.fromJson(e))
          .toList();
    }
    return [];
  }

  Future<Message> sendMessage(
    String conversationId,
    String? content,
    String? filePath, {
    String type = 'TEXT',
  }) async {
    if (filePath != null) {
      final fields = <String, String>{};
      if (content != null) fields['content'] = content;
      fields['type'] =
          type == 'TEXT'
              ? 'IMAGE'
              : type; // Default to IMAGE if file present and type is TEXT

      final response = await ApiService.postMultipart(
        '/chat/conversations/$conversationId/messages',
        fields,
        files: {'file': filePath},
      );
      if (response['data'] != null) {
        return Message.fromJson(response['data']);
      }
      throw Exception(response['message'] ?? 'Failed to send message');
    } else {
      final response = await ApiService.post(
        '/chat/conversations/$conversationId/messages',
        {'content': content, 'type': type},
      );
      if (response['data'] != null) {
        return Message.fromJson(response['data']);
      }
      throw Exception(response['message'] ?? 'Failed to send message');
    }
  }

  Future<void> markAsRead(String conversationId) async {
    await ApiService.post('/chat/conversations/$conversationId/read', {});
  }
}
