class AiChatSource {
  final double? score;
  final String? collection;
  final Map<String, dynamic>? metadata;

  AiChatSource({this.score, this.collection, this.metadata});

  factory AiChatSource.fromJson(Map<String, dynamic> json) {
    return AiChatSource(
      score: (json['score'] as num?)?.toDouble(),
      collection: json['collection'],
      metadata: json['metadata'],
    );
  }
}

class AiMessage {
  final String id;
  final String role;
  final String content;
  final List<AiChatSource>? sources;
  final DateTime createdAt;

  AiMessage({
    required this.id,
    required this.role,
    required this.content,
    this.sources,
    required this.createdAt,
  });

  factory AiMessage.fromJson(Map<String, dynamic> json) {
    return AiMessage(
      id: json['id'].toString(),
      role: json['role'],
      content: json['content'] ?? '',
      sources: (json['sources'] as List<dynamic>?)
          ?.map((e) => AiChatSource.fromJson(e))
          .toList(),
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class AiChatRoom {
  final String id;
  final String title;
  final DateTime createdAt;
  final DateTime updatedAt;

  AiChatRoom({
    required this.id,
    required this.title,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AiChatRoom.fromJson(Map<String, dynamic> json) {
    return AiChatRoom(
      id: json['id'].toString(),
      title: json['title'] ?? 'New Chat',
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}
