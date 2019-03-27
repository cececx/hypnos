const CONFIG = {
  init: { name: "main", id: 0 },
}

/** Load chat
 * @return { id:int32, name:string }
 */
function loadChat() {
  return new Promise((resolve, reject) => {
    resolve(CONFIG.init);
  });
}

/**
 * Callback after user selection.
 * @param id: node id (int32)
 * @param input: user input (object[]). [selections] for multiselection, [text] for text input, or [value] for picker.
 * @return { user_msg: string, next: int32 } next -1 means end the conversation, next -2 means stick to script.
 */
function resolveReaction(id, input) {
  return new Promise((resolve, reject) => {
    switch (id) {
      default: 
        resolve({next: -1});
    }
  });
}

module.exports = {
  resolveReaction: resolveReaction,
  loadChat: loadChat
}