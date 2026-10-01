// The connection to the class room. A thin wrapper so the panels never touch Colyseus.

export function connect({ name, classCode, teacherKey }) {
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;
  const client = new Colyseus.Client(url);
  const handlers = new Map();
  let room = null;
  const on = (type, fn) => { handlers.set(type, fn); if (room) room.onMessage(type, fn); };
  const send = (type, payload) => { if (room) room.send(type, payload || {}); };
  const join = async () => {
    room = await client.joinOrCreate('lab', { name, classCode, teacherKey: teacherKey || undefined });
    for (const [type, fn] of handlers) room.onMessage(type, fn);
    return room;
  };
  return { on, send, join, get room() { return room; } };
}

// Wait for one reply of a given type after sending; the panels use this to keep the
// predict -> result -> judged order explicit.
export function ask(net, sendType, payload, replyType, { timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no ${replyType}`)), timeout);
    const prev = net.room?.onMessage ? null : null; // placeholder for symmetry
    const handler = (m) => { clearTimeout(timer); resolve(m); };
    net.on(replyType, handler);
    net.on('lab:error', (m) => { clearTimeout(timer); reject(new Error(m?.reason || 'error')); });
    net.send(sendType, payload);
  });
}
