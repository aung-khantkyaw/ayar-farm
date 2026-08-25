import 'dart:async';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../models/ai_chat_models.dart';
import '../services/ai_chat_service.dart';
import '../services/api_service.dart';
import '../constants/api_constants.dart';
import 'pdf_reader_screen.dart';
import 'post_screen.dart';

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
    Navigator.pop(context);
  }

  void _selectRoom(AiChatRoom room) {
    _loadRoom(room.id);
    Navigator.pop(context);
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
    final sourceType = (source.metadata?['type'] ?? source.collection ?? '')
        .toString()
        .toLowerCase();
    final isPost = sourceType == 'post' || sourceType == 'posts';

    // Posts → full post detail screen
    if (isPost) {
      final postId =
          source.metadata?['post_id']?.toString() ??
          source.metadata?['record_id']?.toString() ??
          '';

      if (postId.isEmpty) {
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
            builder: (_) => PostScreen(postId: postId),
          ),
        );
      }
      return;
    }

    // Documents / knowledge base → PDF reader
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

    final metadata = source.metadata;
    final documentId = metadata?['document_id']?.toString();
    if (documentId != null && documentId.isNotEmpty) {
      try {
        final response = await ApiService.get('/document/documents/$documentId');
        final url = _extractFileUrl(response['document'] ?? response['data']);
        if (url != null) return url;
      } catch (error) {
        debugPrint('Failed to load source document: $error');
      }
    }

    final kbId = metadata?['kb_id']?.toString();
    if (kbId != null && kbId.isNotEmpty) {
      try {
        final response = await ApiService.get('/knowledge-base/$kbId');
        final url = _extractFileUrl(response['knowledgeBase'] ?? response['data']);
        if (url != null) return url;
      } catch (error) {
        debugPrint('Failed to load source knowledge base: $error');
      }
    }

    return null;
  }

  String? _extractFileUrl(dynamic record) {
    if (record is! Map) return null;
    final fileUrls = record['file_urls'];
    if (fileUrls is List && fileUrls.isNotEmpty) {
      return _toAbsoluteFileUrl(fileUrls.first.toString());
    }
    if (fileUrls is String && fileUrls.isNotEmpty) {
      return _toAbsoluteFileUrl(fileUrls);
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

  // ─── UI ─────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final backgroundColor =
        isDark ? const Color(0xFF0D0D0D) : const Color(0xFFFFFFFF);
    final surfaceColor =
        isDark ? const Color(0xFF171717) : const Color(0xFFF7F7F8);
    final textPrimary =
        isDark ? Colors.white : const Color(0xFF0D0D0D);
    final textSecondary =
        isDark ? const Color(0xFF8E8E8E) : const Color(0xFF6E6E6E);
    final primaryColor = const Color(0xFF2BEE5B);
    final borderColor =
        isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE5E5E5);
    final userBubbleColor =
        isDark ? const Color(0xFF2F2F2F) : const Color(0xFFF3F3F3);
    final inputBg =
        isDark ? const Color(0xFF2F2F2F) : const Color(0xFFF4F4F4);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: backgroundColor,
      drawer: _buildDrawer(
        surfaceColor, textPrimary, textSecondary, primaryColor, borderColor,
      ),
      body: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Column(
            children: [
              _buildAppBar(textPrimary, textSecondary, primaryColor),
              Expanded(
                child: _messages.isEmpty && !_isLoading
                    ? _buildWelcomeView(textPrimary, textSecondary, primaryColor, inputBg)
                    : _buildMessagesList(
                        textPrimary, textSecondary, isDark, userBubbleColor, inputBg,
                      ),
              ),
              _buildInputArea(
                inputBg, textPrimary, textSecondary, borderColor, primaryColor, isDark,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(Color textPrimary, Color textSecondary, Color primaryColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: textPrimary.withOpacity(0.06),
          ),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: Icon(Icons.menu_rounded, color: textPrimary, size: 22),
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          ),
          const Spacer(),
          Text(
            AppLocalizations.of(context)!.aiChatTitle,
            style: TextStyle(
              color: textPrimary,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          const SizedBox(width: 48),
        ],
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _createNewRoom,
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: Text(AppLocalizations.of(context)!.aiChatNewChat),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: textPrimary,
                    side: BorderSide(color: borderColor),
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: _chatRooms.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          AppLocalizations.of(context)!.aiChatNoRooms,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: textSecondary, fontSize: 13),
                        ),
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
                            margin: const EdgeInsets.symmetric(vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                          ),
                          confirmDismiss: (_) async {
                            _deleteRoom(room);
                            return false;
                          },
                          child: Container(
                            margin: const EdgeInsets.symmetric(vertical: 2),
                            child: ListTile(
                              leading: Icon(
                                Icons.chat_bubble_outline_rounded,
                                color: isSelected ? textPrimary : textSecondary,
                                size: 18,
                              ),
                              title: Text(
                                room.title.isEmpty
                                    ? AppLocalizations.of(context)!.aiChatNewChat
                                    : room.title,
                                style: TextStyle(
                                  color: isSelected ? textPrimary : textSecondary,
                                  fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                                  fontSize: 14,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              selected: isSelected,
                              selectedTileColor: primaryColor.withOpacity(0.08),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                              dense: true,
                              onTap: () => _selectRoom(room),
                            ),
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

  Widget _buildWelcomeView(
    Color textPrimary, Color textSecondary, Color primaryColor, Color inputBg,
  ) {
    final l10n = AppLocalizations.of(context)!;
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 32),
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          primaryColor,
                          primaryColor.withOpacity(0.7),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: primaryColor.withOpacity(0.25),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.auto_awesome_rounded,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    l10n.aiChatWelcomeTitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: textPrimary,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.aiChatWelcomeSubtitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: textSecondary,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  _buildSuggestionGrid(textPrimary, textSecondary, primaryColor, inputBg),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSuggestionGrid(
    Color textPrimary, Color textSecondary, Color primaryColor, Color inputBg,
  ) {
    final l10n = AppLocalizations.of(context)!;
    final suggestions = [
      (Icons.bug_report_outlined, l10n.aiChatSuggestionCropDisease),
      (Icons.grass_rounded, l10n.aiChatSuggestionSoilHealth),
      (Icons.wb_sunny_outlined, l10n.aiChatSuggestionWeatherAdvice),
      (Icons.storefront_outlined, l10n.aiChatSuggestionMarketPrices),
    ];

    return GridView.count(
      crossAxisCount: 2,
      mainAxisSpacing: 8,
      crossAxisSpacing: 8,
      childAspectRatio: 2.4,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: suggestions.map((s) {
        return GestureDetector(
          onTap: () {
            _inputController.text = s.$2;
            _sendMessage();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: inputBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: textPrimary.withOpacity(0.06),
              ),
            ),
            child: Row(
              children: [
                Icon(s.$1, size: 18, color: primaryColor),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    s.$2,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildMessagesList(
    Color textPrimary,
    Color textSecondary,
    bool isDark,
    Color userBubbleColor,
    Color inputBg,
  ) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: _messages.length + (_isStreaming ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == _messages.length) {
          return _buildStreamingBubble(textPrimary, textSecondary, isDark, inputBg);
        }

        final message = _messages[index];
        final isUser = message.role == 'USER';

        if (isUser) {
          return _buildUserMessage(message, textPrimary, userBubbleColor);
        } else {
          return _buildAssistantMessage(message, textPrimary, textSecondary, isDark);
        }
      },
    );
  }

  Widget _buildUserMessage(AiMessage message, Color textPrimary, Color userBubbleColor) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.8,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: userBubbleColor,
                borderRadius: BorderRadius.circular(18),
              ),
              child: Text(
                message.content,
                style: TextStyle(
                  color: textPrimary,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssistantMessage(
    AiMessage message, Color textPrimary, Color textSecondary, bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF2BEE5B).withOpacity(0.15) : const Color(0xFF2BEE5B).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Color(0xFF2BEE5B),
              size: 14,
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.content,
                  style: TextStyle(
                    color: textPrimary,
                    fontSize: 14,
                    height: 1.6,
                  ),
                ),
                if (message.sources != null && message.sources!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  _buildSourcesSection(message.sources!, textPrimary, textSecondary),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStreamingBubble(
    Color textPrimary,
    Color textSecondary,
    bool isDark,
    Color inputBg,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF2BEE5B).withOpacity(0.15) : const Color(0xFF2BEE5B).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.auto_awesome_rounded,
              color: Color(0xFF2BEE5B),
              size: 14,
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
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
                            height: 1.6,
                          ),
                        ),
                      ),
                      const SizedBox(width: 2),
                      _buildBlinkingCursor(textPrimary),
                    ],
                  )
                : _buildThinkingIndicator(textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildBlinkingCursor(Color textPrimary) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 600),
      builder: (context, value, child) {
        return Opacity(
          opacity: value > 0.5 ? 1.0 : 0.2,
          child: Container(
            width: 6,
            height: 16,
            margin: const EdgeInsets.only(bottom: 2),
            decoration: BoxDecoration(
              color: textPrimary,
              borderRadius: BorderRadius.circular(1),
            ),
          ),
        );
      },
      child: null,
    );
  }

  Widget _buildThinkingIndicator(Color textSecondary) {
    return Row(
      children: [
        SizedBox(
          width: 14,
          height: 14,
          child: CircularProgressIndicator(
            strokeWidth: 1.5,
            color: textSecondary,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          AppLocalizations.of(context)!.aiChatThinking,
          style: TextStyle(
            color: textSecondary,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildSourcesSection(
    List<AiChatSource> sources, Color textPrimary, Color textSecondary,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context)!.aiChatSources,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: textSecondary,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: sources.map((source) => _buildSourceChip(source, textPrimary, textSecondary)).toList(),
        ),
      ],
    );
  }

  Widget _buildSourceChip(
    AiChatSource source, Color textPrimary, Color textSecondary,
  ) {
    final type = source.metadata?['type'] ?? source.collection ?? AppLocalizations.of(context)!.unknown;
    final typeStr = type.toString().toLowerCase();
    final isPostSource = typeStr == 'post' || typeStr == 'posts';
    final score = source.score != null
        ? '${(source.score! * 100).toStringAsFixed(0)}%'
        : '';
    final title = source.metadata?['title'] as String?;
    final hasFile =
        _sourceFileUrl(source) != null ||
        source.metadata?['document_id'] != null ||
        source.metadata?['kb_id'] != null;

    return GestureDetector(
      onTap: () => _handleSourceClick(source),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: textPrimary.withOpacity(0.04),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: textPrimary.withOpacity(0.08),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isPostSource
                  ? Icons.article_outlined
                  : hasFile
                      ? Icons.picture_as_pdf_outlined
                      : Icons.description_outlined,
              size: 13,
              color: textSecondary,
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                title ?? type.toString(),
                style: TextStyle(
                  fontSize: 12,
                  color: textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (score.isNotEmpty) ...[
              const SizedBox(width: 6),
              Text(
                score,
                style: TextStyle(
                  fontSize: 11,
                  color: textSecondary,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea(
    Color inputBg,
    Color textPrimary,
    Color textSecondary,
    Color borderColor,
    Color primaryColor,
    bool isDark,
  ) {
    final hasText = _inputController.text.trim().isNotEmpty;
    final l10n = AppLocalizations.of(context)!;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: textPrimary.withOpacity(0.06),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              decoration: BoxDecoration(
                color: inputBg,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: borderColor,
                  width: 1,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _inputController,
                      style: TextStyle(color: textPrimary, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: l10n.aiChatInputHint,
                        hintStyle: TextStyle(color: textSecondary, fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 12,
                        ),
                      ),
                      maxLines: 5,
                      minLines: 1,
                      textInputAction: TextInputAction.newline,
                      onSubmitted: (_) => _sendMessage(),
                      enabled: !_isStreaming,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6, right: 6),
                    child: GestureDetector(
                      onTap: (_isStreaming)
                          ? () {
                              _streamSubscription?.cancel();
                              setState(() {
                                _isLoading = false;
                                _isStreaming = false;
                                if (_currentResponse.isNotEmpty) {
                                  _messages.add(AiMessage(
                                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                                    role: 'ASSISTANT',
                                    content: _currentResponse,
                                    createdAt: DateTime.now(),
                                  ));
                                }
                                _currentResponse = "";
                              });
                            }
                          : (hasText ? _sendMessage : null),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: (_isStreaming)
                              ? Colors.red.withOpacity(0.9)
                              : (hasText
                                  ? primaryColor
                                  : textSecondary.withOpacity(0.2)),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: _isLoading && !_isStreaming
                              ? SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 1.5,
                                    color: Colors.white,
                                  ),
                                )
                              : _isStreaming
                                  ? const Icon(Icons.stop_rounded, color: Colors.white, size: 18)
                                  : Icon(
                                      Icons.arrow_upward_rounded,
                                      color: hasText ? Colors.white : textSecondary,
                                      size: 18,
                                    ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.aiChatDisclaimer,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: textSecondary.withOpacity(0.7),
              ),
            ),
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}
