class SessionStore {
  saveSession(id, session) {}
  findAllSession() {}
  findSession(id) {}
}

class InMemorySessionStore extends SessionStore {
  constructor() {
    super();
    this.sessions = new Map();
  }

  saveSession(id, session) {
    return this.sessions.set(id, session);
  }

  findAllSession() {
    return [...this.sessions.values()];
  }

  findSession(id) {
    return this.sessions.get(id);
  }
}

module.exports = { InMemorySessionStore };
