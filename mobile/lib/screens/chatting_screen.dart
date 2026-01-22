import 'package:ayar_farm/widgets/common_header.dart';
import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:ayar_farm/l10n/app_localizations.dart';
import 'package:intl/intl.dart';
import '../models/chat_models.dart';
import '../models/user.dart';
import '../services/chat_service.dart';
import '../services/socket_service.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'direct_chat_screen.dart';
import 'group_chat_screen.dart';

class ChattingScreen extends StatefulWidget {
  const ChattingScreen({super.key});

  @override
  State<ChattingScreen> createState() => _ChattingScreenState();
}

class _ChattingScreenState extends State<ChattingScreen> {
  String _selectedFilter = 'All';
  List<Conversation> _conversations = [];
  bool _isLoading = true;
  final ChatService _chatService = ChatService();
  final SocketService _socketService = SocketService();
  String? _currentUserId;
  late dynamic _messageHandler;
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  List<User> _searchUsers = [];
  List<Conversation> _searchGroups = [];

  @override
  void initState() {
    super.initState();
    _currentUserId = AuthService.currentUser?.id;
    _loadConversations();
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    _messageHandler = (data) {
      if (!mounted) return;

      // Use scheduleMicrotask to avoid widget inspector issues in debug mode
      Future.microtask(() {
        if (!mounted) return;

        try {
          final message = Message.fromJson(data);
          final isMyMessage = message.userId == _currentUserId;
          final convId = message.conversationId;

          final index = _conversations.indexWhere((c) => c.id == convId);

          if (index != -1) {
            final conv = _conversations[index];
            final updatedConv = Conversation(
              id: conv.id,
              type: conv.type,
              name: conv.name,
              description: conv.description,
              imageUrl: conv.imageUrl,
              ownerId: conv.ownerId,
              lastMessage: message.content ?? 'Image',
              lastMessageTime: message.createdAt,
              createdAt: conv.createdAt,
              updatedAt: DateTime.now(),
              participants: conv.participants,
              unreadCount:
                  isMyMessage ? conv.unreadCount : conv.unreadCount + 1,
            );

            if (mounted) {
              setState(() {
                _conversations.removeAt(index);
                _conversations.insert(0, updatedConv);
              });
            }
          } else {
            _loadConversations();
          }
        } catch (e) {
          print('Error handling message: $e');
        }
      });
    };
    _socketService.onNewMessage(_messageHandler);
  }

  @override
  void dispose() {
    _socketService.offNewMessage(_messageHandler);
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _search(String query) async {
    if (query.isEmpty) {
      setState(() {
        _isSearching = false;
        _searchUsers = [];
        _searchGroups = [];
      });
      return;
    }

    setState(() => _isSearching = true);

    try {
      final userResponse = await ApiService.get('/users/search?q=$query');
      final groupResponse = await ApiService.get(
        '/chat/groups/search?q=$query',
      );

      if (mounted) {
        setState(() {
          _searchUsers =
              (userResponse['data'] as List?)
                  ?.map((e) => User.fromJson(e))
                  .toList() ??
              [];
          _searchGroups =
              (groupResponse['data'] as List?)
                  ?.map((e) => Conversation.fromJson(e))
                  .toList() ??
              [];
        });
      }
    } catch (e) {
      print('Search error: $e');
    }
  }

  Future<void> _startDirectChat(User user) async {
    try {
      final conversation = await _chatService.createDirectConversation(user.id);
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => DirectChatScreen(conversation: conversation),
          ),
        );
      }
    } catch (e) {
      CommonSnackbar.show(
        context,
        message: 'Failed to start chat: $e',
        type: SnackBarType.error,
        position: SnackBarPosition.bottom,
      );
    }
  }

  Future<void> _showGroupInfo(Conversation group) async {
    // Check if current user is already a member
    final isMember = group.participants.any((p) => p.userId == _currentUserId);

    if (isMember) {
      // Already a member, go to group chat
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => GroupChatScreen(conversation: group)),
      );
    } else {
      // Not a member, show join dialog
      showDialog(
        context: context,
        builder:
            (context) => AlertDialog(
              title: Text(group.name ?? 'Group'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (group.description != null) Text(group.description!),
                  const SizedBox(height: 8),
                  Text('${group.participants.length} members'),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    CommonSnackbar.show(
                      context,
                      message: 'Join group feature coming soon',
                      type: SnackBarType.info,
                      position: SnackBarPosition.bottom,
                    );
                  },
                  child: const Text('Join'),
                ),
              ],
            ),
      );
    }
  }

  Future<void> _loadConversations() async {
    try {
      final conversations = await _chatService.getConversations();
      if (mounted) {
        setState(() {
          _conversations = conversations;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading conversations: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    const primaryColor = Color(0xFF2BEE5B);
    const primaryContentColor = Color(0xFF052E11);
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final surfaceColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFFFFFFF);
    final surfaceHighlightColor =
        isDark ? const Color(0xFF1E3626) : const Color(0xFFF0F4F1);
    final textMainColor =
        isDark ? const Color(0xFFE1E6E2) : const Color(0xFF111813);
    final textSubColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);
    final borderColor =
        isDark ? const Color(0xFF1E3626) : const Color(0xFFF9FAFB);

    // Filter conversations based on selected filter and search query
    final filteredConversations =
        _conversations.where((conv) {
          // Filter by type
          bool matchesFilter = true;
          if (_selectedFilter == 'Groups') {
            matchesFilter = conv.type == ConversationType.GROUP;
          } else if (_selectedFilter == 'Mentors') {
            matchesFilter = conv.type == ConversationType.DIRECT;
          }

          // Filter by search query
          if (_searchController.text.isNotEmpty) {
            final query = _searchController.text.toLowerCase();
            if (conv.type == ConversationType.GROUP) {
              return matchesFilter &&
                  (conv.name?.toLowerCase().contains(query) ?? false);
            } else {
              final other = conv.participants.firstWhere(
                (p) => p.userId != _currentUserId,
                orElse: () => conv.participants.first,
              );
              return matchesFilter &&
                  (other.user?.name.toLowerCase().contains(query) ?? false);
            }
          }

          return matchesFilter;
        }).toList();

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          const CommonHeader(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: surfaceColor,
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: surfaceHighlightColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 16, right: 8),
                    child: Icon(Icons.search, color: textSubColor),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      style: TextStyle(color: textMainColor),
                      decoration: InputDecoration(
                        hintText:
                            AppLocalizations.of(context)!.searchConversations,
                        hintStyle: TextStyle(color: textSubColor),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.only(bottom: 4),
                      ),
                      onChanged: (value) {
                        _search(value);
                        setState(() {});
                      },
                    ),
                  ),
                  if (_searchController.text.isNotEmpty)
                    IconButton(
                      icon: Icon(Icons.clear, color: textSubColor, size: 20),
                      onPressed: () {
                        _searchController.clear();
                        _search('');
                        setState(() {});
                      },
                    ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            color: surfaceColor,
            child: Container(
              height: 40,
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: surfaceHighlightColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  _buildSegmentButton(
                    'All',
                    AppLocalizations.of(context)!.catAll,
                    isDark,
                    surfaceColor,
                    textMainColor,
                    textSubColor,
                  ),
                  _buildSegmentButton(
                    'Groups',
                    AppLocalizations.of(context)!.groups,
                    isDark,
                    surfaceColor,
                    textMainColor,
                    textSubColor,
                  ),
                  _buildSegmentButton(
                    'Mentors',
                    AppLocalizations.of(context)!.mentors,
                    isDark,
                    surfaceColor,
                    textMainColor,
                    textSubColor,
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Container(
              color: surfaceColor,
              child:
                  _searchController.text.isNotEmpty
                      ? ListView(
                        padding: const EdgeInsets.only(bottom: 100),
                        children: [
                          if (_searchUsers.isNotEmpty) ...[
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Text(
                                'Users',
                                style: TextStyle(
                                  color: textSubColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            ..._searchUsers.map(
                              (user) => ListTile(
                                leading: CircleAvatar(
                                  backgroundImage:
                                      user.profilePicture != null
                                          ? NetworkImage(user.profilePicture!)
                                          : null,
                                  child:
                                      user.profilePicture == null
                                          ? const Icon(Icons.person)
                                          : null,
                                ),
                                title: Text(
                                  user.name,
                                  style: TextStyle(color: textMainColor),
                                ),
                                subtitle: Text(
                                  user.email ?? '',
                                  style: TextStyle(color: textSubColor),
                                ),
                                onTap: () => _startDirectChat(user),
                              ),
                            ),
                          ],
                          if (_searchGroups.isNotEmpty) ...[
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Text(
                                'Groups',
                                style: TextStyle(
                                  color: textSubColor,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            ..._searchGroups.map(
                              (group) => ListTile(
                                leading: CircleAvatar(
                                  backgroundImage:
                                      group.imageUrl != null
                                          ? NetworkImage(group.imageUrl!)
                                          : null,
                                  child:
                                      group.imageUrl == null
                                          ? const Icon(Icons.group)
                                          : null,
                                ),
                                title: Text(
                                  group.name ?? 'Group',
                                  style: TextStyle(color: textMainColor),
                                ),
                                subtitle: Text(
                                  '${group.participants.length} members',
                                  style: TextStyle(color: textSubColor),
                                ),
                                onTap: () => _showGroupInfo(group),
                              ),
                            ),
                          ],
                          if (_searchUsers.isEmpty && _searchGroups.isEmpty)
                            Center(
                              child: Padding(
                                padding: const EdgeInsets.all(32),
                                child: Text(
                                  'No results found',
                                  style: TextStyle(color: textSubColor),
                                ),
                              ),
                            ),
                        ],
                      )
                      : _isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : filteredConversations.isEmpty
                      ? Center(
                        child: Text(
                          "No conversations yet",
                          style: TextStyle(color: textSubColor),
                        ),
                      )
                      : ListView.builder(
                        padding: const EdgeInsets.only(bottom: 100),
                        itemCount: filteredConversations.length,
                        itemBuilder: (context, index) {
                          final conversation = filteredConversations[index];
                          String title = "Chat";
                          String imageUrl = "";

                          if (conversation.type == ConversationType.GROUP) {
                            title = conversation.name ?? "Group";
                            imageUrl = conversation.imageUrl ?? "";
                          } else {
                            try {
                              final other = conversation.participants
                                  .firstWhere(
                                    (p) => p.userId != _currentUserId,
                                    orElse:
                                        () => conversation.participants.first,
                                  );
                              title = other.user?.name ?? "User";
                              imageUrl = other.user?.profilePicture ?? "";
                            } catch (e) {
                              title = "User";
                            }
                          }

                          String time = "";
                          if (conversation.lastMessageTime != null) {
                            final now = DateTime.now();
                            final diff = now.difference(
                              conversation.lastMessageTime!,
                            );
                            if (diff.inDays == 0) {
                              time = DateFormat(
                                'HH:mm',
                              ).format(conversation.lastMessageTime!.toLocal());
                            } else if (diff.inDays < 7) {
                              time = DateFormat(
                                'E',
                              ).format(conversation.lastMessageTime!.toLocal());
                            } else {
                              time = DateFormat(
                                'MM/dd',
                              ).format(conversation.lastMessageTime!.toLocal());
                            }
                          }

                          return GestureDetector(
                            onTap: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder:
                                      (_) =>
                                          conversation.type ==
                                                  ConversationType.GROUP
                                              ? GroupChatScreen(
                                                conversation: conversation,
                                              )
                                              : DirectChatScreen(
                                                conversation: conversation,
                                              ),
                                ),
                              );
                              _loadConversations();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              decoration: BoxDecoration(
                                border: Border(
                                  bottom: BorderSide(
                                    color: borderColor,
                                    width: 1,
                                  ),
                                ),
                              ),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 24,
                                    backgroundColor: surfaceHighlightColor,
                                    backgroundImage:
                                        imageUrl.isNotEmpty
                                            ? NetworkImage(imageUrl)
                                            : null,
                                    child:
                                        imageUrl.isEmpty
                                            ? Icon(
                                              conversation.type ==
                                                      ConversationType.GROUP
                                                  ? Icons.group
                                                  : Icons.person,
                                              color: textSubColor,
                                            )
                                            : null,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                title,
                                                style: TextStyle(
                                                  color: textMainColor,
                                                  fontSize: 16,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            Text(
                                              time,
                                              style: TextStyle(
                                                color: textSubColor,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(
                                                conversation.lastMessage ??
                                                    "No messages yet",
                                                style: TextStyle(
                                                  color: textSubColor,
                                                  fontSize: 14,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ),
                                            if (conversation.unreadCount > 0)
                                              Container(
                                                margin: const EdgeInsets.only(
                                                  left: 8,
                                                ),
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 8,
                                                      vertical: 2,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: primaryColor,
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                child: Text(
                                                  conversation.unreadCount > 99
                                                      ? '99+'
                                                      : conversation.unreadCount
                                                          .toString(),
                                                  style: const TextStyle(
                                                    color: primaryContentColor,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentButton(
    String value,
    String label,
    bool isDark,
    Color surfaceColor,
    Color textMainColor,
    Color textSubColor,
  ) {
    final isSelected = _selectedFilter == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedFilter = value),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? surfaceColor : Colors.transparent,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? textMainColor : textSubColor,
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }
}
