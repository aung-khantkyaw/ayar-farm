import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../models/chat_models.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';
import '../services/socket_service.dart';

class ChatRoomScreen extends StatefulWidget {
  final Conversation conversation;
  final List<Widget>? actions;

  const ChatRoomScreen({Key? key, required this.conversation, this.actions})
    : super(key: key);

  @override
  State<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends State<ChatRoomScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ChatService _chatService = ChatService();
  final SocketService _socketService = SocketService();
  List<Message> _messages = [];
  bool _isLoading = true;
  User? _currentUser;

  late dynamic _messageHandler;

  @override
  void initState() {
    super.initState();
    _currentUser = AuthService.currentUser;
    _loadMessages();
    _setupSocket();
  }

  void _setupSocket() {
    _socketService.joinConversation(widget.conversation.id);
    _messageHandler = (data) {
      if (mounted) {
        final message = Message.fromJson(data);
        if (message.conversationId == widget.conversation.id) {
          // Check if message already exists to verify no duplication
          if (!_messages.any((m) => m.id == message.id)) {
            setState(() {
              _messages.insert(0, message);
            });
            _chatService.markAsRead(widget.conversation.id);
          }
        }
      }
    };
    _socketService.onNewMessage(_messageHandler);
  }

  @override
  void dispose() {
    _socketService.leaveConversation(widget.conversation.id);
    _socketService.offNewMessage(_messageHandler);
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadMessages() async {
    try {
      final messages = await _chatService.getMessages(widget.conversation.id);
      await _chatService.markAsRead(
        widget.conversation.id,
      ); // Mark as read when loading messages
      if (mounted) {
        setState(() {
          _messages = messages;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading messages: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _sendMessage({String? content, String? imagePath}) async {
    if ((content == null || content.trim().isEmpty) && imagePath == null)
      return;

    if (content != null) _messageController.clear();

    try {
      final newMessage = await _chatService.sendMessage(
        widget.conversation.id,
        content,
        imagePath,
      );
      if (mounted) {
        setState(() {
          // Avoid adding duplicate if socket beat us to it (race condition)
          if (!_messages.any((m) => m.id == newMessage.id)) {
            _messages.insert(0, newMessage);
          }
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to send message: $e')));
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      await _sendMessage(imagePath: pickedFile.path);
    }
  }

  String _getTitle() {
    if (widget.conversation.type == ConversationType.GROUP) {
      return widget.conversation.name ?? "Group Chat";
    } else {
      try {
        final other = widget.conversation.participants.firstWhere(
          (p) => p.userId != _currentUser?.id,
        );
        return other.user?.name ?? "User";
      } catch (e) {
        return "Chat";
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Colors (using minimal/default for now, can be improved to match theme)
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(title: Text(_getTitle()), actions: widget.actions),
      body: Column(
        children: [
          Expanded(
            child:
                _isLoading
                    ? Center(child: CircularProgressIndicator())
                    : ListView.builder(
                      reverse: true,
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final message = _messages[index];
                        final isMe = message.userId == _currentUser?.id;
                        return _buildMessageBubble(message, isMe);
                      },
                    ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Message message, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.7,
        ),
        decoration: BoxDecoration(
          color: isMe ? Colors.green[100] : Colors.grey[200],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.type == MessageType.IMAGE && message.fileUrl != null)
              // Use NetworkImage directly or CachedNetworkImage if available.
              // Need to handle full URL or relative.
              // Assuming URL logic needed.
              Image.network(
                message.fileUrl!.startsWith('http')
                    ? message.fileUrl!
                    : 'http://10.0.2.2:3000/${message.fileUrl}', // Basic fix for emulator
                errorBuilder: (c, e, s) => Icon(Icons.broken_image),
              ),

            if (message.content != null && message.content!.isNotEmpty)
              Text(message.content!, style: TextStyle(color: Colors.black87)),

            SizedBox(height: 4),
            Text(
              DateFormat('HH:mm').format(message.createdAt.toLocal()),
              style: TextStyle(fontSize: 10, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 4,
            offset: Offset(0, -1),
          ),
        ],
      ),
      child: Row(
        children: [
          IconButton(icon: Icon(Icons.photo), onPressed: _pickImage),
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                contentPadding: EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
              ),
            ),
          ),
          IconButton(
            icon: Icon(Icons.send, color: Theme.of(context).primaryColor),
            onPressed: () => _sendMessage(content: _messageController.text),
          ),
        ],
      ),
    );
  }
}
