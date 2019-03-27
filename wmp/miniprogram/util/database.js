// Handles data reading/writing to wechat cloud.

const CHAT_TABLE = "chatflow";
const USER_TABLE = "user";

function setIntroStage(stage) {
  return wx.cloud.callFunction({
    name: "update_user",
    data: {
      data: {
        intro_stage: stage
      }
    }
  });
}

function getUserConfig() {
  return wx.cloud.callFunction({
    name: "get_user_config",
  });
}

function loadChat(name, id, callback) {
  const db = wx.cloud.database()
  db.collection(CHAT_TABLE).where({
    name: name
  }).get({
    success: res => {
      callback(res.data[0], id);
    },
    fail: err => {
      wx.showToast({
        icon: "none",
        title: "连接失败"
      })
      console.error("Failed to load data：", err);
    }
  })
};

module.exports = {
  setIntroStage: setIntroStage,
  getUserConfig: getUserConfig,
  loadChat: loadChat
}