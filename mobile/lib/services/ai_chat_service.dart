import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_constants.dart';
import '../models/ai_chat_models.dart';
import 'api_service.dart';

class AiChatService {
  final http.Client _client = http.Client();

  Future<List<AiChatRoom>> getChatRooms() async {
    final response = await ApiService.get('/chat-rooms');
    final rooms = response['chatRooms'] as List<dynamic>?;
    if (rooms == null) return [];
    return rooms.map((e) => AiChatRoom.fromJson(e)).toList();
  }

  Future<AiChatRoom> getChatRoom(String roomId) async {
    final response = await ApiService.get('/chat-rooms/$roomId');
    return AiChatRoom.fromJson(response['chatRoom']);
  }

  Future<AiChatRoom> createChatRoom({String title = 'New Chat'}) async {
    final response = await ApiService.post('/chat-rooms', {'title': title});
    return AiChatRoom.fromJson(response['chatRoom']);
  }

  Future<AiChatRoom> updateChatRoom(
    String roomId, {
    required String title,
  }) async {
    final response = await ApiService.put('/chat-rooms/$roomId', {
      'title': title,
    });
    return AiChatRoom.fromJson(response['chatRoom']);
  }

  Future<void> deleteChatRoom(String roomId) async {
    await ApiService.delete('/chat-rooms/$roomId');
  }

  Future<List<AiMessage>> getChatHistory(String roomId) async {
    final response = await ApiService.get(
      '/ai-chat/history',
      queryParams: {'roomId': roomId},
    );
    final data = response['data'] as List<dynamic>?;
    if (data == null) return [];
    return data.map((e) => AiMessage.fromJson(e)).toList();
  }

  /// Streams a chat response. Returns a [Stream] of SSE events.
  ///
  /// The caller should listen to the stream and handle:
  /// - `user_message`: server acknowledged the question
  /// - `chunk`: partial response content
  /// - `done`: final response with sources
  /// - `error`: error message
  Stream<AiStreamEvent> streamMessage({
    required String question,
    required String roomId,
  }) async* {
    final url = Uri.parse('${ApiConstants.baseUrl}/ai-chat/stream');
    final token = ApiService.getToken();

    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    final request = http.Request('POST', url);
    request.headers.addAll(headers);
    request.body = jsonEncode({'question': question, 'roomId': roomId});

    final response = await _client.send(request);

    if (response.statusCode >= 400) {
      final body = await response.stream.bytesToString();
      final error = jsonDecode(body)['message'] ?? 'Request failed';
      yield AiStreamEvent(type: 'error', message: error);
      return;
    }

    String eventBuffer = '';
    await for (final chunk in response.stream.transform(utf8.decoder)) {
      eventBuffer += chunk;
      final events = eventBuffer.split('\n\n');
      eventBuffer = events.removeLast();

      for (final event in events) {
        final line = event
            .split('\n')
            .where((item) => item.startsWith('data: '))
            .firstOrNull;
        if (line == null || !line.startsWith('data: ')) continue;

        try {
          final data = jsonDecode(line.substring(6));
          final type = data['type'] as String?;

          if (type == 'user_message') {
            yield AiStreamEvent(type: 'user_message');
          } else if (type == 'chunk') {
            yield AiStreamEvent(
              type: 'chunk',
              content: data['content'] as String?,
            );
          } else if (type == 'done') {
            final sources = (data['sources'] as List<dynamic>?)
                ?.map((e) => AiChatSource.fromJson(e))
                .toList();
            yield AiStreamEvent(
              type: 'done',
              content: data['content'] as String?,
              sources: sources,
            );
          } else if (type == 'error') {
            yield AiStreamEvent(
              type: 'error',
              message: data['message'] as String?,
            );
          }
        } catch (_) {
          // Skip unparseable events
        }
      }
    }
  }

  void dispose() {
    _client.close();
  }
}

class AiStreamEvent {
  final String type;
  final String? content;
  final String? message;
  final List<AiChatSource>? sources;

  AiStreamEvent({
    required this.type,
    this.content,
    this.message,
    this.sources,
  });
}
