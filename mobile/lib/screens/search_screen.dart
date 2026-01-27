import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/chat_service.dart';
import '../services/auth_service.dart';
import '../models/user.dart';
import '../models/chat_models.dart';
import 'direct_chat_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ChatService _chatService = ChatService();
  List<User> _users = [];
  List<Conversation> _groups = [];
  bool _isLoading = false;

  Future<void> _search(String query) async {
    if (query.isEmpty) {
      setState(() {
        _users = [];
        _groups = [];
      });
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await ApiService.get('/users/search?q=$query');
      final groupResponse = await ApiService.get(
        '/chat/groups/search?q=$query',
      );

      if (mounted) {
        setState(() {
          _users =
              (response['data'] as List?)
                  ?.map((e) => User.fromJson(e))
                  .toList() ??
              [];
          _groups =
              (groupResponse['data'] as List?)
                  ?.map((e) => Conversation.fromJson(e))
                  .toList() ??
              [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _startDirectChat(User user) async {
    try {
      final conversation = await _chatService.createDirectConversation(user.id);
      if (mounted) {
        Navigator.pop(context);
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
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final textSubColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);

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
                Text(
                  '${group.participants.length} members',
                  style: TextStyle(color: textSubColor),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  try {
                    // Check if user is already authenticated
                    if (AuthService.currentUser?.id == null) {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Please log in to join groups'),
                        ),
                      );
                      return;
                    }

                    // Call the API to add the current user as a participant to the group
                    await ApiService.post(
                      '/chat/conversations/${group.id}/participants',
                      {
                        'participantIds': [AuthService.currentUser!.id],
                      },
                    );

                    // Refetch search results to update the UI
                    if (_searchController.text.isNotEmpty) {
                      await _search(_searchController.text);
                    }

                    // Clear the search input after successful join
                    _searchController.clear();
                    await _search('');

                    CommonSnackbar.show(
                      context,
                      message: 'Successfully joined the group!',
                      type: SnackBarType.info,
                      position: SnackBarPosition.bottom,
                    );

                    // Close the dialog and return true to indicate successful join
                    Navigator.pop(context, true);
                  } catch (e) {
                    Navigator.pop(context);
                    CommonSnackbar.show(
                      context,
                      message: 'Failed to join group: $e',
                      type: SnackBarType.error,
                      position: SnackBarPosition.bottom,
                    );
                  }
                },
                child: const Text('Join'),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final backgroundColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFF6F8F6);
    final surfaceColor =
        isDark ? const Color(0xFF102215) : const Color(0xFFFFFFFF);
    final textMainColor =
        isDark ? const Color(0xFFE1E6E2) : const Color(0xFF111813);
    final textSubColor =
        isDark ? const Color(0xFF8BA892) : const Color(0xFF61896B);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: surfaceColor,
        elevation: 0,
        title: TextField(
          controller: _searchController,
          autofocus: true,
          style: TextStyle(color: textMainColor),
          decoration: InputDecoration(
            hintText: 'Search users or groups...',
            hintStyle: TextStyle(color: textSubColor),
            border: InputBorder.none,
          ),
          onChanged: _search,
        ),
      ),
      body:
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                children: [
                  if (_users.isNotEmpty) ...[
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
                    ..._users.map(
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
                  if (_groups.isNotEmpty) ...[
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
                    ..._groups.map(
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
                  if (_users.isEmpty &&
                      _groups.isEmpty &&
                      _searchController.text.isNotEmpty &&
                      !_isLoading)
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
              ),
    );
  }
}
