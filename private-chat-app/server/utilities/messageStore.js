class MessageStore {
  saveMessage(message) {}
  findMessage(userID) {}
  findAllMessage() {}
}

class InMemoryMessageStore extends MessageStore {
  constructor() {
    super();
    this.messages = [];
  }

  saveMessage(message) {
    this.messages.push(message);
  }

  findMessage(userID) {
    return this.messages.filter(
      (message) => message.from === userID || message.to === userID
    );
  }

  findAllMessage() {
    return this.messages;
  }
}

module.exports = { InMemoryMessageStore };
