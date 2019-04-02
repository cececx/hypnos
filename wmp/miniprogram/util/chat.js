const SCRIPT = [
  { start: 0, end: 37, name: "intro" },
  { start: 50, end: 79, name: "plan" }
];

const ID = {
  PLAN_SLEEP_TIME: 69,       // "我想在 {} 入睡，{} 起床"
  PLAN_SLEEP_TIME_NEXT: 72,  // "好的"
  PLAN_DAYS: 77,             // "我要保持规律作息至少 {} 天"
  PLAN_DAYS_CONFIRM: 79,     // "未来 {} 天，一起加油!"
};

/** Load chat
 * @return { id:int32, name:string }
 */
function loadChat() {
  return new Promise((resolve, reject) => {
    resolve(0);
  });
}

function getScriptName(id) {
  for (let i = 0; i < SCRIPT.length; i++) {
    if (id > SCRIPT[i].end) {
      continue;
    }
    if (id < SCRIPT[i].start) {
      break;
    }
    return SCRIPT[i].name;
  }
}

/**
 * @param {number} id The node id.
 * @return { msg }
 */
function loadMessageNode(id, message) {
  return new Promise((resolve, reject) => {
    switch (id) {
      case ID.PLAN_SLEEP_TIME:
        resolve(loadPlanSleepTime(message));
      case ID.PLAN_DAYS_CONFIRM:
        resolve(loadPlanDaysConfirm(message));
      default:
        resolve(message);
    }
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
      case ID.PLAN_SLEEP_TIME:
        resolve(resolvePlanSleepTime(input));
      case ID.PLAN_DAYS:
        resolve(resolvePlanDays(input));
      default: 
        resolve({ useDefault: true });
    }
  });
}

function resolvePlanSleepTime(input) {
  let profile = getApp().globalData.user.profile;
  let next = -1;
  if (profile.sleepTime) {
    next = ID.PLAN_SLEEP_TIME_NEXT;
  }
  let sleepTime = input[0].value;
  let wakeUpTime = input[1].value;
  profile.sleepTime = sleepTime;
  profile.wakeUpTime = wakeUpTime;
  let msg = `我想在 ${sleepTime} 入睡，${wakeUpTime} 起床`;
  return { msg: msg, next: next };
}

function resolvePlanDays(input) {
  getApp().globalData.user.profile.planDays = input[0].value;
  return({ useDefault: true});
}

function loadPlanSleepTime(message) {
  let profile = getApp().globalData.user.profile;
  if (!profile.sleepTime && !profile.wakeUpTime) {
    return message;
  }
  let msg = {...message};
  console.log(msg);
  msg.content[0].replace_text = profile.sleepTime;
  msg.content[1].replace_text = profile.wakeUpTime;
  console.log("updated message", msg);
  return msg;
}

function loadPlanDaysConfirm(message) {
  console.log(message);
  return message;
}

module.exports = {
  getScriptName: getScriptName,
  loadChat: loadChat,
  loadMessageNode: loadMessageNode,
  resolveReaction: resolveReaction
}