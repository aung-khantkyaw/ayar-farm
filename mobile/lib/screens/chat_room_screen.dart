import 'dart:io';
import 'package:ayar_farm/widgets/common_snackbar.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:video_player/video_player.dart';
import '../models/chat_models.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/chat_service.dart';
import '../services/socket_service.dart';
import '../constants/user_types.dart';

// Helper class to group messages by date
class _MessageGroup {
  final DateTime date;
  final List<Message> messages;

  _MessageGroup({required this.date, required this.messages});
}

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
  Conversation? _conversation;

  late dynamic _messageHandler;

  @override
  void initState() {
    super.initState();
    _currentUser = AuthService.currentUser;
    _loadConversationAndMessages();
    _setupSocket();

    // Initially scroll to the bottom when the widget is first built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  Future<void> _loadConversationAndMessages() async {
    try {
      // Load the full conversation details to ensure participants are loaded
      final updatedConversation = await _chatService.getConversation(
        widget.conversation.id,
      );
      if (mounted) {
        setState(() {
          _conversation = updatedConversation;
        });
        // Force a refresh to update the title with the loaded participants
        _refreshTitle();
      }
    } catch (e) {
      print('Error loading conversation details: $e');
    }

    // Now load messages
    await _loadMessages();
  }

  void _refreshTitle() {
    if (mounted) {
      setState(() {
        // This will trigger a rebuild and update the title
      });
    }
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

            // Scroll to the bottom to show the new message
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (_scrollController.hasClients) {
                _scrollController.animateTo(
                  _scrollController.position.maxScrollExtent,
                  duration: Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              }
            });
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

        // Scroll to the bottom to show the latest messages
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
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

        // Scroll to the bottom to show the new message
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
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

  Widget _getTitleWidget() {
    final conversation = _conversation ?? widget.conversation;
    if (conversation.type == ConversationType.GROUP) {
      return Text(conversation.name ?? "Group Chat");
    } else {
      // Look for the other participant (not the current user)
      final otherParticipant = conversation.participants.firstWhere(
        (p) => p.userId != _currentUser?.id,
        orElse:
            () => ConversationParticipant(
              id: '',
              conversationId: '',
              userId: '',
              joinedAt: DateTime.now(),
              user: User(
                id: '',
                name: "Chat",
                isVerified: false,
                email: '',
                profilePicture: '',
                userType: null,
              ),
            ),
      );

      final displayName = otherParticipant.user?.name ?? "Chat";

      return Row(
        children: [
          if (otherParticipant.user?.profilePicture != null)
            CircleAvatar(
              backgroundImage: NetworkImage(
                otherParticipant.user!.profilePicture!,
              ),
              radius: 16,
            )
          else
            CircleAvatar(child: Icon(Icons.person, size: 16), radius: 16),
          const SizedBox(width: 8),
          Expanded(child: Text(displayName, overflow: TextOverflow.ellipsis)),
        ],
      );
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
                                    user.userType!,
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
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: _getTitleWidget(),
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
            child: Container(
              color: Colors.grey[50],
              child:
                  _isLoading
                      ? Center(child: CircularProgressIndicator())
                      : _buildMessagesList(),
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildMessagesList() {
    // Group messages by date
    final groupedMessages = _groupMessagesByDate(_messages);

    // Create a list of widgets for each message group with date headers
    List<Widget> messageWidgets = [];

    // Process groups in chronological order (oldest first) so oldest messages appear at the top
    for (var group in groupedMessages) {
      // Add date header
      messageWidgets.add(
        Container(
          alignment: Alignment.center,
          padding: EdgeInsets.symmetric(vertical: 10),
          child: Text(
            _formatDateHeader(group.date),
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      );

      // Add messages in chronological order (oldest first in the group)
      for (var message in group.messages) {
        final isMe = message.userId == _currentUser?.id;
        messageWidgets.add(_buildMessageBubble(message, isMe));
      }
    }

    return ListView(
      reverse: false, // Don't reverse, show oldest at top, newest at bottom
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: messageWidgets,
    );
  }

  // Helper function to group messages by date
  List<_MessageGroup> _groupMessagesByDate(List<Message> messages) {
    Map<String, List<Message>> grouped = {};

    for (var message in messages) {
      var date = _getDateOnly(message.createdAt);
      var dateStr = date.toString();

      if (!grouped.containsKey(dateStr)) {
        grouped[dateStr] = [];
      }
      grouped[dateStr]!.add(message);
    }

    // Sort each group's messages by creation date (oldest first)
    grouped.forEach((key, value) {
      value.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    });

    // Convert to list and sort dates in ascending order (oldest first)
    var sortedEntries =
        grouped.entries.toList()..sort(
          (a, b) => DateTime.parse(a.key).compareTo(DateTime.parse(b.key)),
        );

    return sortedEntries
        .map(
          (entry) => _MessageGroup(
            date: DateTime.parse(entry.key),
            messages: entry.value,
          ),
        )
        .toList();
  }

  // Helper function to get date part only (without time)
  DateTime _getDateOnly(DateTime dateTime) {
    return DateTime(dateTime.year, dateTime.month, dateTime.day);
  }

  // Helper function to format date header
  String _formatDateHeader(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = DateTime(now.year, now.month, now.day - 1);
    final dateOnly = DateTime(date.year, date.month, date.day);

    if (dateOnly == today) {
      return 'Today';
    } else if (dateOnly == yesterday) {
      return 'Yesterday';
    } else {
      // Format as "Day, Month dd, yyyy" (e.g., "Monday, Jan 1, 2023")
      return DateFormat('EEEE, MMM d, yyyy').format(date);
    }
  }

  Widget _buildMessageBubble(Message message, bool isMe) {
    String senderName = "You";
    if (!isMe) {
      if (message.user != null) {
        senderName = message.user!.name;
      } else {
        final participants = _conversation ?? widget.conversation;
        final sender = participants.participants.firstWhere(
          (p) => p.userId == message.userId,
          orElse:
              () => ConversationParticipant(
                id: '',
                conversationId: '',
                userId: '',
                joinedAt: DateTime.now(),
                user: User(
                  id: '',
                  name: 'Unknown',
                  isVerified: false,
                  email: '',
                  profilePicture: '',
                  userType: null,
                ),
              ),
        );
        senderName = sender.user?.name ?? 'Unknown';
      }
    }

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(left: 16, right: 16, top: 4, bottom: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Show sender name for messages that are not from the current user
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isMe ? Colors.green[100] : Colors.grey[100],
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(18),
                  topRight: Radius.circular(18),
                  bottomLeft: isMe ? Radius.circular(18) : Radius.circular(4),
                  bottomRight: isMe ? Radius.circular(4) : Radius.circular(18),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!isMe)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        senderName,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[700],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  if (message.type == MessageType.IMAGE &&
                      message.fileUrl != null)
                    // Handle image messages with download button
                    Stack(
                      children: [
                        Container(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              message.fileUrl!.startsWith('http')
                                  ? message.fileUrl!
                                  : 'http://10.0.2.2:3000/${message.fileUrl}',
                              width: 200,
                              height: 150,
                              fit: BoxFit.cover,
                              errorBuilder:
                                  (c, e, s) => Container(
                                    width: 200,
                                    height: 150,
                                    decoration: BoxDecoration(
                                      color: Colors.grey[300],
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Icon(
                                      Icons.broken_image,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                              loadingBuilder: (
                                context,
                                child,
                                loadingProgress,
                              ) {
                                if (loadingProgress == null) return child;
                                return Container(
                                  width: 200,
                                  height: 150,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[200],
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Center(
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  ),
                                );
                              },
                            ),
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
                                size: 16,
                              ),
                              onPressed:
                                  () => _downloadMediaFile(message.fileUrl!),
                              tooltip: 'Download image',
                              padding: EdgeInsets.zero,
                              constraints: BoxConstraints.tight(Size(28, 28)),
                            ),
                          ),
                        ),
                      ],
                    ),

                  if (message.type == MessageType.VIDEO &&
                      message.fileUrl != null)
                    // Handle video messages
                    Container(child: _buildVideoPlayer(message)),

                  if (message.content != null && message.content!.isNotEmpty)
                    Text(
                      message.content!,
                      style: TextStyle(color: Colors.black87, fontSize: 14),
                    ),

                  // Timestamp
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          DateFormat(
                            'HH:mm',
                          ).format(message.createdAt.toLocal()),
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
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
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: Colors.black,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: _VideoPlayerWithController(
          videoUrl: _getVideoUrl(message),
          key: ValueKey(message.id),
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

  Future<void> _downloadMediaFile(String fileUrl) async {
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

    try {
      // Request permissions
      if (Platform.isAndroid) {
        var status = await Permission.storage.request();
        if (status != PermissionStatus.granted) {
          CommonSnackbar.show(
            context,
            message: 'Storage permission is required to download files',
            type: SnackBarType.error,
            position: SnackBarPosition.bottom,
          );
          return;
        }
      } else if (Platform.isIOS) {
        var status = await Permission.photos.request();
        if (status != PermissionStatus.granted) {
          CommonSnackbar.show(
            context,
            message: 'Photos permission is required to save files',
            type: SnackBarType.error,
            position: SnackBarPosition.bottom,
          );
          return;
        }
      }

      // Download the file
      final response = await http.get(Uri.parse(fullUrl));
      if (response.statusCode == 200) {
        // Get the download directory
        Directory? downloadDir;

        if (Platform.isAndroid) {
          // On Android, use the application's external storage directory
          // This is accessible to the user and other apps
          downloadDir = await getExternalStorageDirectory();
          if (downloadDir != null) {
            // Place in the app's external directory which is accessible to user
            downloadDir = Directory('${downloadDir.path}/ayarfarm');
          } else {
            // Fallback to application documents directory if external storage is not available
            downloadDir = await getApplicationDocumentsDirectory();
          }
        } else if (Platform.isIOS) {
          // On iOS, use the documents directory
          downloadDir = await getApplicationDocumentsDirectory();
        } else {
          // For other platforms, use application documents directory
          downloadDir = await getApplicationDocumentsDirectory();
        }

        // Create ayarfarm subdirectory if it doesn't exist
        if (!await downloadDir.exists()) {
          await downloadDir.create(recursive: true);
        }

        // Create the file path
        final filePath = '${downloadDir.path}/$fileName';
        final file = File(filePath);

        // Write the downloaded data to the file
        await file.writeAsBytes(response.bodyBytes);

        CommonSnackbar.show(
          context,
          message: 'Successfully downloaded $fileName to AyeyarFarm folder!',
          type: SnackBarType.info,
          position: SnackBarPosition.bottom,
        );
      } else {
        CommonSnackbar.show(
          context,
          message: 'Failed to download file. Status: ${response.statusCode}',
          type: SnackBarType.error,
          position: SnackBarPosition.bottom,
        );
      }
    } catch (e) {
      CommonSnackbar.show(
        context,
        message: 'Error downloading file: $e',
        type: SnackBarType.error,
        position: SnackBarPosition.bottom,
      );
    }
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
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
          IconButton(
            icon: Icon(Icons.attach_file, color: Colors.grey[600]),
            onPressed: _pickFile,
            splashRadius: 20,
          ),
          Expanded(
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                ),
                onSubmitted:
                    (value) => _sendMessage(content: _messageController.text),
              ),
            ),
          ),
          IconButton(
            icon: Icon(Icons.send, color: Theme.of(context).primaryColor),
            onPressed: () => _sendMessage(content: _messageController.text),
            splashRadius: 20,
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
