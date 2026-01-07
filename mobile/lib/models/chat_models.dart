import 'user.dart';

enum ConversationType { DIRECT, GROUP }

enum MessageType { TEXT, IMAGE, FILE }

class Conversation {
  final String id;
  final ConversationType type;
  final String? name;
  final String? description;
  final String? imageUrl;
  final String? ownerId;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ConversationParticipant> participants;
  final int unreadCount;

  Conversation({
    required this.id,
    required this.type,
    this.name,
    this.description,
    this.imageUrl,
    this.ownerId,
    this.lastMessage,
    this.lastMessageTime,
    required this.createdAt,
    required this.updatedAt,
    this.participants = const [],
    this.unreadCount = 0,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'],
      type: ConversationType.values.firstWhere(
        (e) => e.toString().split('.').last == json['type'],
        orElse: () => ConversationType.DIRECT,
      ),
      name: json['name'],
      description: json['description'],
      imageUrl: json['imageUrl'],
      ownerId: json['ownerId'],
      lastMessage: json['lastMessage'],
      lastMessageTime:
          json['lastMessageTime'] != null
              ? DateTime.parse(json['lastMessageTime'])
              : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      participants:
          (json['participants'] as List<dynamic>?)
              ?.map((e) => ConversationParticipant.fromJson(e))
              .toList() ??
          [],
      unreadCount: json['unreadCount'] ?? 0,
    );
  }
}

class ConversationParticipant {
  final String id;
  final String conversationId;
  final String userId;
  final DateTime joinedAt;
  final User? user;

  ConversationParticipant({
    required this.id,
    required this.conversationId,
    required this.userId,
    required this.joinedAt,
    this.user,
  });

  factory ConversationParticipant.fromJson(Map<String, dynamic> json) {
    return ConversationParticipant(
      id: json['id'],
      conversationId: json['conversationId'],
      userId: json['userId'],
      joinedAt: DateTime.parse(json['joinedAt']),
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }
}

class Message {
  final String id;
  final String conversationId;
  final String userId;
  final MessageType type;
  final String? content;
  final String? fileUrl;
  final String? fileName;
  final int? fileSize;
  final DateTime createdAt;
  final User? user;

  Message({
    required this.id,
    required this.conversationId,
    required this.userId,
    required this.type,
    this.content,
    this.fileUrl,
    this.fileName,
    this.fileSize,
    required this.createdAt,
    this.user,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      conversationId: json['conversationId'],
      userId: json['userId'],
      type: MessageType.values.firstWhere(
        (e) => e.toString().split('.').last == json['type'],
        orElse: () => MessageType.TEXT,
      ),
      content: json['content'],
      fileUrl: json['fileUrl'],
      fileName: json['fileName'],
      fileSize: json['fileSize'],
      createdAt: DateTime.parse(json['createdAt']),
      user: json['user'] != null ? User.fromJson(json['user']) : null,
    );
  }
}
