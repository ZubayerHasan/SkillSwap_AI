const existingConversation = await Conversation.findOne({
    exchangeRequest: exchange._id,
});

if (!existingConversation) {
    await Conversation.create({
        participants: [
            exchange.requester,
            exchange.receiver,
        ],
        exchangeRequest: exchange._id,
    });
}
/api/messages/send
/api/messages/:conversationId
/api/conversations
participants: req.user._id
conversation.participants.includes(req.user._id)
