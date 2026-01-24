import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:video_player/video_player.dart';
import '../models/chat_models.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';
import '../services/socket_service.dart';
import '../constants/user_types.dart';

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
      CommonSnackbar.show(
        context,
        message: 'Failed to send message: $e',
        type: SnackBarType.error,
        position: SnackBarPosition.bottom,
      );
    }
  }

  Future<void> _pickFile() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickMedia();
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

  void _showGroupDetails() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return Container(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Group header with name and description
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.conversation.name ?? "Group Name",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    if (widget.conversation.description != null)
                      Text(
                        widget.conversation.description!,
                        style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                      ),
                  ],
                ),
              ),

              SizedBox(height: 16),

              // Participants section
              Text(
                "Participants (${widget.conversation.participants.length})",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              SizedBox(height: 8),

              // Participants list
              Flexible(
                child: Container(
                  height: 300, // Fixed height for the list
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: widget.conversation.participants.length,
                    itemBuilder: (context, index) {
                      final participant =
                          widget.conversation.participants[index];
                      final user = participant.user;
                      final isOwner =
                          participant.userId == widget.conversation.ownerId;

                      return ListTile(
                        leading: CircleAvatar(
                          backgroundImage:
                              user?.profilePicture != null
                                  ? NetworkImage(user!.profilePicture!)
                                  : null,
                          child:
                              user?.profilePicture == null
                                  ? Icon(Icons.person)
                                  : null,
                          backgroundColor: Colors.grey[300],
                        ),
                        title: Row(
                          children: [
                            Text(user?.name ?? "Unknown User"),
                            if (isOwner)
                              Container(
                                margin: EdgeInsets.only(left: 8),
                                padding: EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.blue,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  "Admin",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (user?.userType != null)
                              Text(
                                userTypeLabels[user!.userType!] ??
                                    user!.userType!,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),

              SizedBox(height: 16),

              // Leave group button
              Container(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    try {
                      await _chatService.leaveGroup(widget.conversation.id);
                      Navigator.pop(context); // Close bottom sheet
                      Navigator.pop(context); // Return to previous screen
                    } catch (e) {
                      CommonSnackbar.show(
                        context,
                        message: 'Failed to leave group: $e',
                        type: SnackBarType.error,
                        position: SnackBarPosition.bottom,
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                  child: Text("Leave Group"),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Colors (using minimal/default for now, can be improved to match theme)
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(_getTitle()),
        actions: [
          if (widget.conversation.type == ConversationType.GROUP)
            IconButton(
              icon: Icon(Icons.info_outline),
              onPressed: _showGroupDetails,
              tooltip: 'View group details',
            ),
        ],
      ),
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
              // Handle image messages with download button
              Stack(
                children: [
                  Container(
                    child: Image.network(
                      message.fileUrl!.startsWith('http')
                          ? message.fileUrl!
                          : 'http://10.0.2.2:3000/${message.fileUrl}',
                      errorBuilder: (c, e, s) => Icon(Icons.broken_image),
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          width: 200,
                          height: 150,
                          color: Colors.black12,
                          child: Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        );
                      },
                    ),
                  ),
                  // Download button for images
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: IconButton(
                        icon: Icon(
                          Icons.download,
                          color: Colors.white,
                          size: 18,
                        ),
                        onPressed: () => _downloadMediaFile(message.fileUrl!),
                        tooltip: 'Download image',
                      ),
                    ),
                  ),
                ],
              ),

            if (message.type == MessageType.VIDEO && message.fileUrl != null)
              // Handle video messages
              _buildVideoPlayer(message),

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

  Widget _buildVideoPlayer(Message message) {
    return Container(
      width: 200,
      height: 150,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: _VideoPlayerWithController(
          videoUrl: _getVideoUrl(message),
          key: ValueKey(message.id ?? message.fileUrl),
        ),
      ),
    );
  }

  String _getVideoUrl(Message message) {
    String videoUrl = message.fileUrl!;
    if (!videoUrl.startsWith('http')) {
      videoUrl = 'http://10.0.2.2:3000/$videoUrl';
    }
    return videoUrl;
  }

  void _downloadMediaFile(String fileUrl) {
    // Determine if it's an image or video based on file extension
    String fullUrl = fileUrl;
    if (!fullUrl.startsWith('http')) {
      fullUrl = 'http://10.0.2.2:3000/$fileUrl';
    }

    String fileName = fileUrl.split('/').last;
    String fileType = fileName.toLowerCase().split('.').last;

    String message = 'Starting download of $fileName...';
    if (['jpg', 'jpeg', 'png', 'gif'].contains(fileType)) {
      message = 'Starting image download...';
    } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].contains(fileType)) {
      message = 'Starting video download...';
    }

    CommonSnackbar.show(
      context,
      message: message,
      type: SnackBarType.info,
      position: SnackBarPosition.bottom,
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
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
          IconButton(icon: Icon(Icons.attach_file), onPressed: _pickFile),
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

// A StatefulWidget to properly manage the VideoPlayerController lifecycle
class _VideoPlayerWithController extends StatefulWidget {
  final String videoUrl;

  const _VideoPlayerWithController({Key? key, required this.videoUrl})
    : super(key: key);

  @override
  State<_VideoPlayerWithController> createState() =>
      _VideoPlayerWithControllerState();
}

class _VideoPlayerWithControllerState
    extends State<_VideoPlayerWithController> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;
  bool _hasError = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeVideoPlayer();
  }

  @override
  void didUpdateWidget(_VideoPlayerWithController oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Re-initialize if the video URL changes
    if (widget.videoUrl != oldWidget.videoUrl) {
      _disposeController();
      _initializeVideoPlayer();
    }
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  void _disposeController() {
    if (_controller.value.isInitialized) {
      _controller.dispose();
    }
  }

  Future<void> _initializeVideoPlayer() async {
    try {
      _controller = VideoPlayerController.network(widget.videoUrl);

      _controller.addListener(() {
        if (_controller.value.hasError) {
          setState(() {
            _hasError = true;
            _errorMessage = _controller.value.errorDescription;
          });
        }
      });

      await _controller.initialize();

      if (mounted) {
        setState(() {
          _isInitialized = true;
          _hasError = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Container(
        width: 200,
        height: 150,
        color: Colors.black12,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, color: Colors.red, size: 32),
            const SizedBox(height: 8),
            Text(
              'Video Error',
              style: TextStyle(color: Colors.red, fontSize: 12),
            ),
            Text(
              _errorMessage ?? 'Unknown error',
              style: TextStyle(color: Colors.red, fontSize: 10),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    if (!_isInitialized) {
      return Container(
        width: 200,
        height: 150,
        color: Colors.black12,
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    return Stack(
      children: [
        GestureDetector(
          onTap: () {
            // Toggle play/pause on tap
            if (_controller.value.isPlaying) {
              _controller.pause();
            } else {
              _controller.play();
            }
          },
          child: Stack(
            fit: StackFit.passthrough,
            children: [
              AspectRatio(
                aspectRatio: _controller.value.aspectRatio,
                child: VideoPlayer(_controller),
              ),
              // Play/Pause overlay - only show when video is not playing
              if (!_controller.value.isPlaying)
                Container(
                  color: Colors.black26,
                  child: const Icon(
                    Icons.play_arrow,
                    color: Colors.white,
                    size: 48,
                  ),
                ),
              // Loading indicator when buffering
              if (_controller.value.isBuffering)
                const Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Center(
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
            ],
          ),
        ),
        // Download button positioned at top-right corner
        Positioned(
          top: 8,
          right: 8,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(16),
            ),
            child: IconButton(
              icon: Icon(Icons.download, color: Colors.white, size: 18),
              onPressed: () => _downloadMedia(),
              tooltip: 'Download video',
            ),
          ),
        ),
      ],
    );
  }

  void _downloadMedia() {
    // Call the shared download method from the parent widget
    final parentState = context.findAncestorStateOfType<_ChatRoomScreenState>();
    if (parentState != null) {
      parentState._downloadMediaFile(widget.videoUrl);
    }
  }
}
