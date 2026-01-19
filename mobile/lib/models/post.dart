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

class Post {
  final String id;
  final String? content;
  final String authorId;
  final DateTime createdAt;
  final List<PostMedia> media;
  final List<String> tags;
  final User author;
  final PostCount counts;

  Post({
    required this.id,
    this.content,
    required this.authorId,
    required this.createdAt,
    required this.media,
    required this.tags,
    required this.author,
    required this.counts,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
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
    );
  }
}
