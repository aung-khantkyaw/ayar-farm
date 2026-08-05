import 'package:flutter/material.dart';
import '../models/chat_models.dart';
import 'chat_room_screen.dart';

class GroupChatScreen extends StatelessWidget {
  final Conversation conversation;

  const GroupChatScreen({Key? key, required this.conversation}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ChatRoomScreen(
        conversation: conversation,
        actions: [
            IconButton(
                icon: Icon(Icons.info_outline), 
                onPressed: () {
                    // TODO: Show group info / participants
                    showDialog(context: context, builder: (c) => AlertDialog(
                        title: Text(conversation.name ?? "Group Info"),
                        content: Text("Participants: ${conversation.participants.length}"),
                    ));
                }
            )
        ],
    );
  }
}
