import 'dart:io';
import 'dart:ui';
import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/post.dart';
import '../services/auth_service.dart';
import '../services/post_service.dart';

class CreatePostScreen extends StatefulWidget {
  final String? postId;
  final String? initialContent;
  final List<String>? initialTags;
  final List<PostMedia>? initialMedia;
  final String? initialVisibility;

  const CreatePostScreen({
    super.key,
    this.postId,
    this.initialContent,
    this.initialTags,
    this.initialMedia,
    this.initialVisibility,
  });

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final TextEditingController _textController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  final List<Attachment> _attachments = [];
  final List<PostMedia> _existingMedia = [];
  final List<String> _selectedHashtags = [];
  bool _isLoading = false;
  String _visibility = 'PUBLIC';

  // Hashtags from Request
  final List<String> _availableHashtags = [
    "ကောက်ပဲသီးနှံများ",
    "ခြံမွေးတိရစ္ဆာန်များ",
    "ငါးလုပ်ငန်း",
    "လယ်ယာသုံးစက်ကိရိယာများ",
    "မိုးလေဝသ",
    "ပေါက်ဈေး",
    "စိုက်ပျိုးရေးနည်းပညာများ",
    "သစ်တောစိုက်ပျိုးရေး",
    "မြေညီပင်စိုက်ပျိုးရေး",
    "မြေသြဇာနှင့်ဓာတုသယံဇာ",
    "ဆေးပင်များနှင့်အပင်များ",
    "အပင်ကာကွယ်ဆေးများ",
    "အရောင်းအဝယ်ဈေးကွက်",
    "အဆောက်အအုံများ",
    "အိမ်မွေးတိရစ္ဆာန်ကျန်းမာရေး",
    "ချေးငွေ",
  ];

  // Colors from HTML
  static const _primaryColor = Color(0xFF2BEE5B);
  // HTML body bg is #102215, but main content is #1a2e1f in dark mode
  static const _bgDarkContent = Color(0xFF1A2E1F);
  static const _textLight = Color(0xFF111813);

  @override
  void initState() {
    super.initState();
    _textController.addListener(_onTextChanged);
    _initFromInitialValues();
  }

  bool get _isEdit => widget.postId != null;

  void _initFromInitialValues() {
    if (widget.initialContent != null) {
      _textController.text = widget.initialContent!;
    }
    if (widget.initialTags != null) {
      _selectedHashtags
        ..clear()
        ..addAll(widget.initialTags!);
    }
    if (widget.initialVisibility != null) {
      _visibility = widget.initialVisibility!;
    }
    if (widget.initialMedia != null) {
      _existingMedia
        ..clear()
        ..addAll(widget.initialMedia!);
    }
  }

  void _onTextChanged() {
    setState(() {
      _selectedHashtags.clear();
      for (final tag in _availableHashtags) {
        if (_textController.text.contains("#$tag")) {
          _selectedHashtags.add(tag);
        }
      }
    });
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image != null) {
        setState(() {
          _attachments.add(Attachment(type: AttachmentType.image, file: image));
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  Future<void> _pickVideo() async {
    try {
      final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
      if (video != null) {
        setState(() {
          _attachments.add(
            Attachment(
              type: AttachmentType.video,
              file: video,
              fileName: video.name,
            ),
          );
        });
      }
    } catch (e) {
      debugPrint('Error picking video: $e');
    }
  }

  Future<void> _pickDocument() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        withData: kIsWeb,
      );

      if (result != null) {
        setState(() {
          _attachments.addAll(
            result.files.map((f) {
              final xfile =
                  kIsWeb
                      ? XFile.fromData(f.bytes!, name: f.name)
                      : XFile(f.path!);
              return Attachment(
                type: AttachmentType.document,
                file: xfile,
                fileName: f.name,
              );
            }),
          );
        });
      }
    } catch (e) {
      debugPrint('Error picking document: $e');
    }
  }

  void _removeAttachment(Attachment attachment) {
    setState(() {
      _attachments.remove(attachment);
    });
  }

  void _toggleHashtag(String tag) {
    String text = _textController.text;
    final tagText = "#$tag";

    if (text.contains(tagText)) {
      text = text.replaceAll(tagText, "").replaceAll("  ", " ").trim();
    } else {
      text = text.trim();
      if (text.isNotEmpty) text += " ";
      text += tagText;
    }

    _textController.value = TextEditingValue(
      text: text,
      selection: TextSelection.fromPosition(TextPosition(offset: text.length)),
    );
  }

  Future<void> _handlePost() async {
    if (_textController.text.trim().isEmpty && _attachments.isEmpty) {
      CommonSnackbar.show(
        context,
        message: 'Please add some content to your post',
        type: SnackBarType.warning,
        position: SnackBarPosition.bottom,
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final newFiles =
          _attachments
              .map((a) => kIsWeb ? a.file : XFile(a.file.path))
              .toList();

      if (_isEdit) {
        final updated = await PostService.updatePost(
          postId: widget.postId!,
          content: _textController.text,
          tags: _selectedHashtags,
          files: newFiles,
          existingMedia: _existingMedia,
          visibility: _visibility,
        );
        if (updated != null && mounted) {
          Navigator.pop(context, updated);
        } else if (mounted) {
          CommonSnackbar.show(
            context,
            message: 'Failed to update post',
            type: SnackBarType.error,
            position: SnackBarPosition.bottom,
          );
        }
      } else {
        final success = await PostService.createPost(
          content: _textController.text,
          tags: _selectedHashtags,
          files: newFiles,
          visibility: _visibility,
        );

        if (success && mounted) {
          Navigator.pop(context, true);
        } else if (mounted) {
          CommonSnackbar.show(
            context,
            message: 'Failed to create post',
            type: SnackBarType.error,
            position: SnackBarPosition.bottom,
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Background colors based on HTML:
    // Header/Main: bg-white dark:bg-[#1a2e1f]
    final surfaceColor = isDark ? _bgDarkContent : Colors.white;
    final textColor = isDark ? Colors.white : _textLight;
    final borderColor = isDark ? Colors.grey[800]! : Colors.grey[200]!;
    final placeholderColor = isDark ? Colors.grey[400] : Colors.grey[400];

    return Scaffold(
      backgroundColor: surfaceColor,
      appBar: AppBar(
        backgroundColor: surfaceColor,
        elevation: 0,
        leadingWidth: 80,
        leading: TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(
            "Cancel",
            style: TextStyle(
              color: isDark ? Colors.grey[400] : Colors.grey[600],
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        centerTitle: true,
        title: Text(
          _isEdit ? "Edit Post" : "Create Post",
          style: TextStyle(
            color: textColor,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: GestureDetector(
                onTap: _isLoading ? null : _handlePost,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _primaryColor.withOpacity(_isLoading ? 0.7 : 1.0),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child:
                      _isLoading
                          ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFF102215),
                            ),
                          )
                          : const Text(
                            "Save",
                            style: TextStyle(
                              color: Color(0xFF102215),
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                ),
              ),
            ),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: borderColor, height: 1),
        ),
      ),
      body: Column(
        children: [
          // User Profile Header
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.grey[200]!),
                    image: DecorationImage(
                      image: NetworkImage(
                        user?.profilePicture ??
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuB08WycaqQf6qDMvQ6C_-qjUxUqsDhr33pVQe43A5nr4XuMOhh8Uo7hgXXdN53Hzo2tp2ZqxBfw0g6WrNf3vBawL9JN0Tb8yPwer0nGD8xOxSH0pqwMWc2gUwvGE7tBpjWq6HYEFuXpEvm7ScFub73K9ZK6M11Zpoh9uuF80wZEzZmwqfBpXY8bbZjTx1YJcaplJ0SmfSCN7sho8vMNbI3U8uWag0d6r9aONK4yitllZ6pHwfC5UMPExOzT9H7BMnJ_fbUG5WJWkU16",
                      ),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.name ?? "Marcus Thompson",
                      style: TextStyle(
                        color: textColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    PopupMenuButton<String>(
                      initialValue: _visibility,
                      onSelected: (String value) {
                        setState(() {
                          _visibility = value;
                        });
                      },
                      itemBuilder:
                          (BuildContext context) => <PopupMenuEntry<String>>[
                            const PopupMenuItem<String>(
                              value: 'PUBLIC',
                              child: Row(
                                children: [
                                  Icon(Icons.public, size: 16),
                                  SizedBox(width: 8),
                                  Text('Public'),
                                ],
                              ),
                            ),
                            const PopupMenuItem<String>(
                              value: 'COMMUNITY',
                              child: Row(
                                children: [
                                  Icon(Icons.groups, size: 16),
                                  SizedBox(width: 8),
                                  Text('Community'),
                                ],
                              ),
                            ),
                            const PopupMenuItem<String>(
                              value: 'PRIVATE',
                              child: Row(
                                children: [
                                  Icon(Icons.lock, size: 16),
                                  SizedBox(width: 8),
                                  Text('Only Me'),
                                ],
                              ),
                            ),
                          ],
                      child: Row(
                        children: [
                          Icon(
                            _visibility == 'PUBLIC'
                                ? Icons.public
                                : _visibility == 'COMMUNITY'
                                ? Icons.groups
                                : Icons.lock,
                            size: 12,
                            color: Colors.grey[500],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _visibility == 'PUBLIC'
                                ? "Public"
                                : _visibility == 'COMMUNITY'
                                ? "Community"
                                : "Only Me",
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(width: 2),
                          Icon(
                            Icons.arrow_drop_down,
                            size: 16,
                            color: Colors.grey[500],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Composer / Text Input
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      maxLines: null,
                      keyboardType: TextInputType.multiline,
                      style: TextStyle(color: textColor, fontSize: 18),
                      decoration: InputDecoration(
                        border: InputBorder.none,
                        hintText:
                            "Share your agricultural knowledge or ask a question...",
                        hintStyle: TextStyle(
                          color: placeholderColor,
                          fontSize: 18,
                        ),
                      ),
                    ),
                  ),

                  // Hashtag Selector
                  Container(
                    height: 40,
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _availableHashtags.length,
                      separatorBuilder:
                          (context, index) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final tag = _availableHashtags[index];
                        final isSelected = _selectedHashtags.contains(tag);
                        return GestureDetector(
                          onTap: () => _toggleHashtag(tag),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color:
                                  isSelected
                                      ? _primaryColor
                                      : (isDark
                                          ? Colors.grey[800]
                                          : Colors.grey[200]),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color:
                                    isSelected
                                        ? _primaryColor
                                        : (isDark
                                            ? Colors.grey[700]!
                                            : Colors.grey[300]!),
                              ),
                            ),
                            child: Text(
                              "#$tag",
                              style: TextStyle(
                                color:
                                    isSelected
                                        ? const Color(0xFF102215)
                                        : (isDark
                                            ? Colors.grey[300]
                                            : Colors.grey[700]),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Existing media preview (for edit mode)
          if (_existingMedia.isNotEmpty)
            Container(
              height: 144,
              margin: const EdgeInsets.only(bottom: 8),
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _existingMedia.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final media = _existingMedia[index];
                  return _buildExistingMediaPreview(media, isDark, textColor);
                },
              ),
            ),

          // Media Preview Section for new attachments
          if (_attachments.isNotEmpty)
            Container(
              height: 144, // 128 (image) + 16 (padding)
              margin: const EdgeInsets.only(bottom: 8),
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _attachments.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final attachment = _attachments[index];
                  return _buildAttachmentPreview(
                    attachment: attachment,
                    child: _buildPreviewContent(attachment, isDark, textColor),
                  );
                },
              ),
            ),

          // Attachment Toolbar
          Container(
            decoration: BoxDecoration(
              color: surfaceColor,
              border: Border(top: BorderSide(color: borderColor)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    _buildToolbarButton(
                      Icons.camera_alt_outlined,
                      isDark,
                      () => _pickImage(ImageSource.camera),
                    ),
                    _buildToolbarButton(
                      Icons.image_outlined,
                      isDark,
                      () => _pickImage(ImageSource.gallery),
                    ),
                    _buildToolbarButton(
                      Icons.videocam_outlined,
                      isDark,
                      () => _pickVideo(),
                    ),
                    _buildToolbarButton(
                      Icons.description_outlined,
                      isDark,
                      () => _pickDocument(),
                    ),
                  ],
                ),
                Text(
                  "240 characters left",
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttachmentPreview({
    required Widget child,
    required Attachment attachment,
  }) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        SizedBox(width: 128, height: 128, child: child),
        Positioned(
          top: -8,
          right: -8,
          child: GestureDetector(
            onTap: () => _removeAttachment(attachment),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withOpacity(0.8), // slate-900/80
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPreviewContent(
    Attachment attachment,
    bool isDark,
    Color textColor,
  ) {
    if (attachment.type == AttachmentType.image) {
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.grey[800]! : Colors.grey[200]!,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child:
              kIsWeb
                  ? Image.network(
                    attachment.file.path,
                    fit: BoxFit.cover,
                    errorBuilder:
                        (context, error, stackTrace) =>
                            const Center(child: Icon(Icons.error)),
                  )
                  : Image.file(
                    File(attachment.file.path),
                    fit: BoxFit.cover,
                    errorBuilder:
                        (context, error, stackTrace) =>
                            const Center(child: Icon(Icons.error)),
                  ),
        ),
      );
    } else if (attachment.type == AttachmentType.video) {
      return Container(
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Icon(Icons.play_circle_fill, color: Colors.white, size: 48),
        ),
      );
    } else {
      // Document
      return Container(
        decoration: BoxDecoration(
          color: isDark ? Colors.grey[800] : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
          ),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.picture_as_pdf, color: Colors.red, size: 32),
            const SizedBox(height: 4),
            Text(
              attachment.fileName ?? "Document",
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: textColor,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildExistingMediaPreview(
    PostMedia media,
    bool isDark,
    Color textColor,
  ) {
    final isImage = media.type.toUpperCase() == 'IMAGE';
    final isVideo = media.type.toUpperCase() == 'VIDEO';
    Widget content;

    if (isImage) {
      content = ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.network(
          media.thumbnail ?? media.url,
          width: double.infinity,
          height: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.error)),
        ),
      );
    } else if (isVideo) {
      content = Container(
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Icon(Icons.play_circle_fill, color: Colors.white, size: 48),
        ),
      );
    } else {
      content = Container(
        decoration: BoxDecoration(
          color: isDark ? Colors.grey[800] : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.grey[700]! : Colors.grey[200]!,
          ),
        ),
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.insert_drive_file,
              color: Colors.blueGrey,
              size: 32,
            ),
            const SizedBox(height: 4),
            Text(
              _extractFileName(media.url),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: textColor,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    return Stack(
      clipBehavior: Clip.none,
      children: [
        SizedBox(width: 128, height: 128, child: content),
        Positioned(
          top: -8,
          right: -8,
          child: GestureDetector(
            onTap: () {
              setState(() {
                _existingMedia.remove(media);
              });
            },
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withOpacity(0.8),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 16),
            ),
          ),
        ),
      ],
    );
  }

  String _extractFileName(String url) {
    try {
      final uri = Uri.tryParse(url);
      final segments = uri?.pathSegments;
      if (segments != null && segments.isNotEmpty) {
        final last = segments.last;
        if (last.isNotEmpty) return last;
      }
    } catch (_) {}

    if (url.contains('/')) return url.split('/').last;
    return 'File';
  }

  Widget _buildToolbarButton(
    IconData icon,
    bool isDark,
    VoidCallback onPressed,
  ) {
    return Container(
      margin: const EdgeInsets.only(right: 4),
      child: IconButton(
        icon: Icon(icon),
        color: isDark ? Colors.grey[400] : Colors.grey[600],
        onPressed: onPressed,
        splashRadius: 24,
      ),
    );
  }
}

enum AttachmentType { image, video, document }

class Attachment {
  final AttachmentType type;
  final XFile file;
  final String? fileName;

  Attachment({required this.type, required this.file, this.fileName});
}
