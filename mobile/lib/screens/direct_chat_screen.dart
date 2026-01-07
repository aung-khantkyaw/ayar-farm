import 'package:flutter/material.dart';
import '../models/chat_models.dart';
import 'chat_room_screen.dart';

class DirectChatScreen extends StatelessWidget {
  final Conversation conversation;

  const DirectChatScreen({Key? key, required this.conversation}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ChatRoomScreen(conversation: conversation);
  }
}
