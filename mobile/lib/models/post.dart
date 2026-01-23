import 'user.dart';

enum PostMediaType { IMAGE, VIDEO }

class PostMedia {
  final String id;
  final String url;
  final String type;
  final String? thumbnail;

  PostMedia({
    required this.id,
    required this.url,
    required this.type,
    this.thumbnail,
  });

  factory PostMedia.fromJson(Map<String, dynamic> json) {
    return PostMedia(
      id: json['id'],
      url: json['url'],
      type: json['type'],
      thumbnail: json['thumbnail'],
    );
  }
}

class PostCount {
  final int reactions;
  final int comments;

  PostCount({required this.reactions, required this.comments});

  factory PostCount.fromJson(Map<String, dynamic> json) {
    return PostCount(
      reactions: json['reactions'] ?? 0,
      comments: json['comments'] ?? 0,
    );
  }
}

class PostReaction {
  final String userId;
  final String type;

  PostReaction({required this.userId, required this.type});

  factory PostReaction.fromJson(Map<String, dynamic> json) {
    final userId =
        json['userId'] ??
        json['user_id'] ??
        json['user']?['id'] ??
        json['user']?['userId'];
    return PostReaction(
      userId: userId?.toString() ?? '',
      type: json['type']?.toString() ?? '',
    );
  }
}

class Post {
  final String id;
  final String? content;
  final String authorId;
  final DateTime createdAt;
  final List<PostMedia> media;
  final List<String> tags;
  final User author;
  final PostCount counts;
  final List<String> reactionUserIds;
  final List<PostReaction> reactions;

  Post({
    required this.id,
    this.content,
    required this.authorId,
    required this.createdAt,
    required this.media,
    required this.tags,
    required this.author,
    required this.counts,
    List<String>? reactionUserIds,
    List<PostReaction>? reactions,
  }) : reactionUserIds = reactionUserIds ?? const [],
       reactions = reactions ?? const [];

  factory Post.fromJson(Map<String, dynamic> json) {
    final parsedReactions = _parseReactions(json);
    return Post(
      id: json['id'],
      content: json['content'],
      authorId: json['authorId'],
      createdAt: DateTime.parse(json['createdAt']),
      media:
          (json['media'] as List<dynamic>?)
              ?.map((e) => PostMedia.fromJson(e))
              .toList() ??
          [],
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          [],
      author: User.fromJson(json['author']),
      counts: PostCount.fromJson(json['_count'] ?? {}),
      reactionUserIds: _parseReactionUserIds(json, parsedReactions),
      reactions: parsedReactions,
    );
  }

  static List<PostReaction> _parseReactions(Map<String, dynamic> json) {
    final reactions = json['reactions'];
    if (reactions is! List) return const [];
    return reactions
        .whereType<Map>()
        .map((item) => PostReaction.fromJson(Map<String, dynamic>.from(item)))
        .where((r) => r.userId.isNotEmpty && r.type.isNotEmpty)
        .toList();
  }

  static List<String> _parseReactionUserIds(
    Map<String, dynamic> json,
    List<PostReaction> parsedReactions,
  ) {
    if (parsedReactions.isNotEmpty) {
      return parsedReactions.map((r) => r.userId).toList();
    }

    final reactions = json['reactions'];
    if (reactions is! List) return [];

    return reactions
        .map((item) {
          if (item is Map<String, dynamic>) {
            final userId =
                item['userId'] ??
                item['user_id'] ??
                item['user']?['id'] ??
                item['user']?['userId'];
            if (userId != null) return userId.toString();
          } else if (item != null) {
            return item.toString();
          }
          return null;
        })
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toList();
  }
}
