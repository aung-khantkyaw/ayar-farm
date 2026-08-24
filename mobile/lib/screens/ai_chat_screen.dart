import 'dart:async';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../models/ai_chat_models.dart';
import '../services/ai_chat_service.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import '../widgets/common_header.dart';
import 'pdf_reader_screen.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final AiChatService _aiChatService = AiChatService();
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  List<AiChatRoom> _chatRooms = [];
  AiChatRoom? _selectedRoom;
  List<AiMessage> _messages = [];
  bool _isLoading = false;
  bool _isStreaming = false;
  String _currentResponse = "";
  StreamSubscription<AiStreamEvent>? _streamSubscription;

  @override
  void initState() {
    super.initState();
    _inputController.addListener(() {
      setState(() {});
    });
    _loadChatRooms();
  }

  @override
  void dispose() {
    _streamSubscription?.cancel();
    _inputController.dispose();
    _scrollController.dispose();
    _aiChatService.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _loadChatRooms() async {
    try {
      final rooms = await _aiChatService.getChatRooms();
      if (mounted) {
        setState(() {
          _chatRooms = rooms;
        });
      }
    } catch (e) {
      debugPrint('Failed to load chat rooms: $e');
    }
  }

  Future<void> _loadRoom(String roomId) async {
    try {
      final room = await _aiChatService.getChatRoom(roomId);
      final history = await _aiChatService.getChatHistory(roomId);
      if (mounted) {
        setState(() {
          _selectedRoom = room;
          _messages = history;
        });
        _scrollToBottom();
      }
    } catch (e) {
      debugPrint('Failed to load room: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.aiChatFailedToLoadRoom)),
        );
      }
    }
  }

  void _createNewRoom() {
    setState(() {
      _selectedRoom = null;
      _messages = [];
    });
    Navigator.pop(context); // Close drawer
  }

  void _selectRoom(AiChatRoom room) {
    _loadRoom(room.id);
    Navigator.pop(context); // Close drawer
  }

  Future<void> _deleteRoom(AiChatRoom room) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context)!.aiChatDeleteRoomTitle),
        content: Text(
          AppLocalizations.of(context)!.aiChatDeleteRoomConfirm(room.title),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(AppLocalizations.of(context)!.aiChatCancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text(AppLocalizations.of(context)!.aiChatDelete),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _aiChatService.deleteChatRoom(room.id);
        setState(() {
          _chatRooms.removeWhere((r) => r.id == room.id);
          if (_selectedRoom?.id == room.id) {
            _selectedRoom = null;
            _messages = [];
          }
        });
      } catch (e) {
        debugPrint('Failed to delete chat room: $e');
      }
    }
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isLoading) return;

    _inputController.clear();
    setState(() {
      _isLoading = true;
      _isStreaming = true;
      _currentResponse = "";
      _messages.add(AiMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        role: 'USER',
        content: text,
        createdAt: DateTime.now(),
      ));
    });
    _scrollToBottom();

    late final AiChatRoom activeRoom;

    // Create a room before sending the first message.
    if (_selectedRoom == null) {
      try {
        activeRoom = await _aiChatService.createChatRoom(title: AppLocalizations.of(context)!.aiChatNewChat);
        setState(() {
          _selectedRoom = activeRoom;
          _chatRooms.insert(0, activeRoom);
        });
      } catch (e) {
        debugPrint('Failed to create chat room: $e');
        setState(() {
          _isLoading = false;
          _isStreaming = false;
        });
        return;
      }
    } else {
      activeRoom = _selectedRoom!;
    }

    // Update room title if first message
    if (_messages.length == 1) {
      final truncatedTitle =
          text.length > 50 ? '${text.substring(0, 50)}...' : text;
      try {
        final updated = await _aiChatService.updateChatRoom(
          activeRoom.id,
          title: truncatedTitle,
        );
        setState(() {
          _selectedRoom = updated;
          final idx = _chatRooms.indexWhere((r) => r.id == activeRoom.id);
          if (idx >= 0) _chatRooms[idx] = updated;
        });
      } catch (e) {
        debugPrint('Failed to update room title: $e');
      }
    }

    // Stream response
    String fullResponse = "";
    try {
      final stream = _aiChatService.streamMessage(
        question: text,
        roomId: activeRoom.id,
      );

      _streamSubscription = stream.listen(
        (event) {
          if (!mounted) return;

          switch (event.type) {
            case 'user_message':
              setState(() => _isLoading = false);
              break;
            case 'chunk':
              fullResponse += event.content ?? '';
              setState(() => _currentResponse = fullResponse);
              _scrollToBottom();
              break;
            case 'done':
              fullResponse = event.content ?? fullResponse;
              setState(() {
                _currentResponse = "";
                _messages.add(AiMessage(
                  id: DateTime.now().millisecondsSinceEpoch.toString(),
                  role: 'ASSISTANT',
                  content: fullResponse,
                  sources: event.sources,
                  createdAt: DateTime.now(),
                ));
              });
              _scrollToBottom();
              break;
            case 'error':
              throw Exception(event.message ?? 'Unknown error');
          }
        },
        onError: (error) {
          if (!mounted) return;
          setState(() {
            _messages.add(AiMessage(
              id: DateTime.now().millisecondsSinceEpoch.toString(),
              role: 'ASSISTANT',
              content: AppLocalizations.of(context)!.aiChatError,
              createdAt: DateTime.now(),
            ));
          });
        },
        onDone: () {
          if (mounted) {
            setState(() {
              _isLoading = false;
              _isStreaming = false;
              _currentResponse = "";
            });
          }
        },
        cancelOnError: false,
      );
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isStreaming = false;
          _messages.add(AiMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            role: 'ASSISTANT',
            content: AppLocalizations.of(context)!.aiChatError,
            createdAt: DateTime.now(),
          ));
        });
      }
    }
  }

  Future<void> _handleSourceClick(AiChatSource source) async {
    final fileUrl = await _resolveSourceFileUrl(source);
    final title = source.metadata?['title']?.toString() ?? AppLocalizations.of(context)!.aiChatSourceDocument;

    if (fileUrl == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.aiChatSourceUnavailable)),
        );
      }
      return;
    }

    if (mounted) {
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => PdfReaderScreen(fileUrl: fileUrl, title: title),
        ),
      );
    }
  }

  Future<String?> _resolveSourceFileUrl(AiChatSource source) async {
    final directUrl = _sourceFileUrl(source);
    if (directUrl != null) return directUrl;

    final documentId = source.metadata?['document_id']?.toString();
    if (documentId == null || documentId.isEmpty) return null;

    try {
      final response = await ApiService.get('/document/documents/$documentId');
      final document = response['document'] ?? response['data'];
      final fileUrls = document is Map ? document['file_urls'] : null;
      if (fileUrls is List && fileUrls.isNotEmpty) {
        return _toAbsoluteFileUrl(fileUrls.first.toString());
      }
      if (fileUrls is String && fileUrls.isNotEmpty) {
        return _toAbsoluteFileUrl(fileUrls);
      }
    } catch (error) {
      debugPrint('Failed to load source document: $error');
    }
    return null;
  }

  String? _sourceFileUrl(AiChatSource source) {
    final metadata = source.metadata;
    if (metadata == null) return null;

    for (final key in const [
      'fileUrl',
      'file_url',
      'sourceUrl',
      'source_url',
      'url',
      'documentUrl',
      'document_url',
    ]) {
      final value = metadata[key]?.toString();
      if (value != null && value.isNotEmpty) {
        return _toAbsoluteFileUrl(value);
      }
    }
    return null;
  }

  String _toAbsoluteFileUrl(String fileUrl) {
    if (RegExp(r'^https?://').hasMatch(fileUrl)) return fileUrl;
    return '${ApiConstants.baseUrl.replaceAll('/api', '')}/$fileUrl';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final surfaceColor =
        isDark ? const Color(0xFF1A2C1E) : Colors.white;
    final textPrimary =
        isDark ? Colors.white : const Color(0xFF1A1A1A);
    final textSecondary =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF6B7280);
    final primaryColor = const Color(0xFF2BEE5B);
    final borderColor =
        isDark ? Colors.white.withOpacity(0.1) : const Color(0xFFE5E7EB);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: backgroundColor,
      drawer: _buildDrawer(
        surfaceColor, textPrimary, textSecondary, primaryColor, borderColor,
      ),
      body: SafeArea(
        bottom: false,
        child: Padding(
          // MainScreen draws CommonBottomNav over its child screens.
          padding: const EdgeInsets.only(bottom: 20),
          child: Column(
            children: [
              const CommonHeader(),
              Container(
                padding: const EdgeInsets.only(bottom: 20),
                color: surfaceColor,
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(Icons.menu_rounded, color: textPrimary),
                      tooltip: AppLocalizations.of(context)!.aiChatHistoryTooltip,
                      onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppLocalizations.of(context)!.aiChatTitle,
                            style: TextStyle(
                              color: textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            AppLocalizations.of(context)!.aiChatSubtitle,
                            style: TextStyle(color: textSecondary, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _messages.isEmpty && !_isLoading
                    ? _buildWelcomeView(textPrimary, textSecondary)
                    : _buildMessagesList(textPrimary, textSecondary, isDark),
              ),
              _buildInputArea(
                surfaceColor,
                textPrimary,
                textSecondary,
                borderColor,
                primaryColor,
                isDark,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer(
    Color surfaceColor,
    Color textPrimary,
    Color textSecondary,
    Color primaryColor,
    Color borderColor,
  ) {
    return Drawer(
      backgroundColor: surfaceColor,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _createNewRoom,
                  icon: const Icon(Icons.add, size: 18),
                  label: Text(AppLocalizations.of(context)!.aiChatNewChat),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.black,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: _chatRooms.isEmpty
                  ? Center(
                      child: Text(
                        AppLocalizations.of(context)!.aiChatNoRooms,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: textSecondary, fontSize: 14),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      itemCount: _chatRooms.length,
                      itemBuilder: (context, index) {
                        final room = _chatRooms[index];
                        final isSelected = _selectedRoom?.id == room.id;
                        return Dismissible(
                          key: Key(room.id),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 16),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.delete, color: Colors.red),
                          ),
                          confirmDismiss: (_) async {
                            _deleteRoom(room);
                            return false;
                          },
                          child: ListTile(
                            leading: Icon(
                              Icons.chat_bubble_outline,
                              color: isSelected ? primaryColor : textSecondary,
                              size: 20,
                            ),
                            title: Text(
                              room.title.isEmpty ? AppLocalizations.of(context)!.aiChatNewChat : room.title,
                              style: TextStyle(
                                color: isSelected ? primaryColor : textPrimary,
                                fontWeight: isSelected
                                    ? FontWeight.w600
                                    : FontWeight.normal,
                                fontSize: 14,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            selected: isSelected,
                            selectedTileColor: primaryColor.withOpacity(0.1),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                            ),
                            onTap: () => _selectRoom(room),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeView(Color textPrimary, Color textSecondary) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A1A1A),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      color: Color(0xFF2BEE5B),
                      size: 32,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    AppLocalizations.of(context)!.aiChatWelcomeTitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    AppLocalizations.of(context)!.aiChatWelcomeSubtitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: textSecondary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMessagesList(
    Color textPrimary,
    Color textSecondary,
    bool isDark,
  ) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: _messages.length + (_isStreaming ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _messages.length) {
          // Streaming indicator
          return _buildStreamingBubble(textPrimary, textSecondary, isDark);
        }

        final message = _messages[index];
        final isUser = message.role == 'USER';

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            mainAxisAlignment:
                isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isUser) ...[
                Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: Color(0xFF1A1A1A),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.auto_awesome,
                    color: Color(0xFF2BEE5B),
                    size: 18,
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: isUser
                        ? const Color(0xFF1A1A1A)
                        : (isDark
                            ? const Color(0xFF1A2C1E)
                            : Colors.white),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: isUser
                          ? const Radius.circular(16)
                          : const Radius.circular(4),
                      bottomRight: isUser
                          ? const Radius.circular(4)
                          : const Radius.circular(16),
                    ),
                    border: isUser
                        ? null
                        : Border.all(
                            color: isDark
                                ? Colors.white.withOpacity(0.1)
                                : const Color(0xFFE5E7EB),
                          ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.content,
                        style: TextStyle(
                          color: isUser ? Colors.white : textPrimary,
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                      if (message.sources != null &&
                          message.sources!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _buildSourcesSection(message.sources!, textPrimary),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStreamingBubble(
    Color textPrimary,
    Color textSecondary,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: Color(0xFF1A1A1A),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.auto_awesome,
              color: Color(0xFF2BEE5B),
              size: 18,
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1A2C1E) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withOpacity(0.1)
                      : const Color(0xFFE5E7EB),
                ),
              ),
              child: _currentResponse.isNotEmpty
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Flexible(
                          child: Text(
                            _currentResponse,
                            style: TextStyle(
                              color: textPrimary,
                              fontSize: 14,
                              height: 1.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        SizedBox(
                          width: 8,
                          height: 16,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: textPrimary,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Row(
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: textSecondary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          AppLocalizations.of(context)!.aiChatThinking,
                          style: TextStyle(
                            color: textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSourcesSection(List<AiChatSource> sources, Color textPrimary) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppLocalizations.of(context)!.aiChatSources,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: textPrimary.withOpacity(0.5),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          ...sources.map((source) => _buildSourceCard(source, textPrimary)),
        ],
      ),
    );
  }

  Widget _buildSourceCard(AiChatSource source, Color textPrimary) {
    final type = source.metadata?['type'] ?? source.collection ?? AppLocalizations.of(context)!.unknown;
    final score = source.score != null
        ? '${(source.score! * 100).toStringAsFixed(0)}%'
        : '';
    final title = source.metadata?['title'] as String?;
    final author = source.metadata?['author'] as String?;
    final hasFile =
        _sourceFileUrl(source) != null ||
        source.metadata?['document_id'] != null;

    return GestureDetector(
      onTap: () => _handleSourceClick(source),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    type.toString().toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: textPrimary,
                    ),
                  ),
                ),
                Row(
                  children: [
                    if (score.isNotEmpty)
                      Text(
                        score,
                        style: TextStyle(
                          fontSize: 11,
                          color: textPrimary.withOpacity(0.5),
                        ),
                      ),
                    const SizedBox(width: 4),
                    Icon(
                      hasFile ? Icons.picture_as_pdf_outlined : Icons.info_outline,
                      size: 12,
                      color: textPrimary.withOpacity(0.5),
                    ),
                  ],
                ),
              ],
            ),
            if (title != null) ...[
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (author != null) ...[
              const SizedBox(height: 2),
              Text(
                AppLocalizations.of(context)!.aiChatByAuthor(author),
                style: TextStyle(
                  fontSize: 11,
                  color: textPrimary.withOpacity(0.5),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea(
    Color surfaceColor,
    Color textPrimary,
    Color textSecondary,
    Color borderColor,
    Color primaryColor,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(top: BorderSide(color: borderColor)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: borderColor),
                    ),
                    child: TextField(
                      controller: _inputController,
                      style: TextStyle(color: textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: AppLocalizations.of(context)!.aiChatInputHint,
                        hintStyle: TextStyle(color: textSecondary),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                      maxLines: null,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      enabled: !_isStreaming,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: (!_inputController.text.trim().isEmpty && !_isStreaming)
                        ? primaryColor
                        : textSecondary.withOpacity(0.3),
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    onPressed: (!_inputController.text.trim().isEmpty && !_isStreaming)
                        ? _sendMessage
                        : null,
                    icon: _isLoading
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.send, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              AppLocalizations.of(context)!.aiChatDisclaimer,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
