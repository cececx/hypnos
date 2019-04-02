// miniprogram/pages/chatbot/chatbot.js
var chat = require('../../util/chat.js');
var database = require('../../util/database.js');

const OPTION_TYPE = {
  SINGLE_SELECT: 'single',
  MULTI_SELECT: 'multiple',
  PICKER: 'picker',
  TEXT_INPUT: 'text_input'
};

const CHAT_TYPE = {
  CHATBOT: 'chatbot',
  USER: 'user'
};

const TIMEOUT_MSG_BEFORE = 0;
const TIMEOUT_MSG_AFTER_FACTOR = 0;
const PICKER_TEMP_TEXT = "___";

Page({

  /**
   * Display data.
   * chat: { type:CHAT_TYPE, content:string }[]
   * option_display: bool
   * option_type: OPTION_TYPE
   * options (multiple): { 
   *    content:   (string) option content.
   *    text:      (string) message content.
   *    exclusive: (boolean) whether this option is exclusive.
   *    next:      (number) next id.
   *    checked:   (boolean) whether this option is checked.
   * }[]
   * options (single): {
   *    content:   (string) option content.
   *    text :     (string) message content.
   *    next :     (number) next id.
   * }[]
   * options (picker): {
   *    template:  (string) picker display message template.
   *    type:      (string) "range" | "time" | "date".
   *    content:   (string) picker display message.
   *    range:     (string[]) content.range.
   *    value:     (number|string) current value.
   *    class:     (string) "checked" if checked.
   * }[]
   * send_state: (string) "disabled" if disabled
   */
  data: {
    chat: [],
    option_display: false,
    option_type: 'multiple',
    options: [],
    send_state: "disabled",
    scrollTop: 0,
  },

  current_id: -1,
  default_next_id: -1,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // database.loadUserProfile();
    chat.loadChat().then(this.loadMessage);
  },

  getOptionCallback: function (id) {
    switch (id) {
      case MS_SLEEP_IMPROVE_ID: return this.callbackSleepImprovement
      case PK_SLEEP_LENGTH_ID: return this.callbackSleepLength
      default: console.error("Failed to get callback for node ", id)
    }
  },

  /**
   * Resolves user reaction.
   * @param {number} id The current node id.
   * @param {string} type MULTISELECT, PICKER, or TEXT.
   * @param {Object[]} options
   * @returns {Promise<Resolve>}
   */
  resolveReaction: function (type, options) {
    return new Promise((resolve, reject) => {
      chat.resolveReaction(this.current_id, options).then((res) => {
        if (res.useDefault) {
          resolve(this.resolveDefault(type, options));
        }
        else {
          if (res.next == -1) {
            res.next = this.default_next_id;
          }
          resolve(res);
        }
      })
    });
  },

  resolveDefault: function (type, options) {
    switch (type) {
      case OPTION_TYPE.MULTI_SELECT:
        return this.resolveMultiSelect(options);
      case OPTION_TYPE.PICKER:
        return this.resolvePicker(options);
      default:
        return { next: -2, msg: "" }; 
    }
  },

  /** 
   * Resolves multiple selection.
   * 
   * @typedef {Object} Resolve
   * @property {number} next The next node id, -1 for unspecified, -2 for ending chat.
   * @property {string} msg The message typed by user.
   * 
   * @param {Object[]} options User selected options.
   * @param {string} options[].text
   * @param {boolean} options[].checked
   * @param {number} options[].next
   * @returns {Resolve}
   */
  resolveMultiSelect: function (options) {
    console.log(options);
    let lines = [];
    let next = -1;
    for (let i = 0; i < options.length; i++) {
      if (options[i].checked) {
        lines.push(options[i].text);
        next = options[i].next;
      }
    }
    return {
      next: next,
      msg: lines.join("，")
    }
  },

  resolvePicker: function (options) {
    let lines = [];
    let next = this.default_next_id;
    for (let i = 0; i < options.length; i++) {
      lines.push(options[i].content);
    }
    return {
      next: next,
      msg: lines.join("，")
    };
  },

  callbackSleepLength: function (value) {
    return {
      next: PK_SLEEP_LENGTH_NEXT
    }
  },

  /**
   * Chat message display.
   */
  scrollToBottom: function () {
    let len = this.data.chat.length
    this.setData({
      scrollTop: len * 1000,
    })
  },

  sendMessage: function (message, type) {
    this.data.chat.push({ type: type, content: message })
    this.setData({
      chat: this.data.chat
    })
    this.scrollToBottom()
  },

  loadMessage: function (id) {
    if (id == undefined) {
      console.error("loadMessage: id is undefined");
      return;
    }
    if (id == -2) {
      return;
    }
    if (this.chat_flow && this.chat_flow[id]) {
      this.loadMessageContext(id);
      return;
    } else {
      let name = chat.getScriptName(id);
      if (name) {
        database.loadChat(name, id, (chatflow, id) => {
          console.log(`Loading script "${name}"`)
          this.chat_flow = chatflow;
          this.loadMessage(id);
        });
      } else {
        console.error("Failed to load script name");
      }
    }
  },

  loadMessageContext: function(id) {
    console.log("loadMessageContext: ", id);
    chat.loadMessageNode(id, this.chat_flow[id]).then((message) => {
      this.current_id = id;
      this.default_next_id = message.default_next;
      if (message.type == "CHATBOT") {
        this.addChatbotMessage(message.content[0])
      }
      else if (message.type == "USER") {
        switch (message.option_type) {
          case OPTION_TYPE.SINGLE_SELECT:
            this.addSingleSelect(message.content);
            break;
          case OPTION_TYPE.MULTI_SELECT:
            this.addMultiSelect(message.content, id);
            break;
          case OPTION_TYPE.PICKER:
            this.addPicker(message.content, id);
            break;
          default:
            break;
        }
      }
    });
  },

  addChatbotMessage: function (content) {
    setTimeout(function () {
      this.sendMessage(content.text, "chatbot")
    }.bind(this), TIMEOUT_MSG_BEFORE)
    let len = content.text.length
    setTimeout(function () {
      this.loadMessage(content.next)
    }.bind(this), len * TIMEOUT_MSG_AFTER_FACTOR)
  },

  addSingleSelect: function (content) {
    for (let i = 0; i < content.length; i++) {
      let option = content[i]
      this.data.options.push({
        content: option.option,
        text: option.text,
        next: option.next
      })
    }
    this.setData({
      options: this.data.options,
      option_display: true,
      option_type: OPTION_TYPE.SINGLE_SELECT
    })
    this.scrollToBottom()
  },

  addMultiSelect: function (content) {
    for (let i = 0; i < content.length; i++) {
      let option = content[i]
      this.data.options.push({
        content: option.option,
        text: option.text,
        exclusive: option.unique,
        next: option.next,
        checked: false
      })
    }
    this.setData({
      options: this.data.options,
      option_display: true,
      option_type: OPTION_TYPE.MULTI_SELECT,
    })
    this.scrollToBottom();
  },

  addPicker: function (content) {
    console.log("add picker ", content)
    let options = [];
    for (let i = 0; i < content.length; i++) {
      let option = content[i];
      let mode = option.type;
      let value = option.default_value;
      let replace_text = PICKER_TEMP_TEXT;
      if (option.replace_text) {
        replace_text = option.replace_text;
      }
      if (mode == "range") {
        mode = "selector";
        for (let i = 0; i < option.range.length; i++) {
          if (option.range[i] == value) {
            value = i;
            break;
          }
        }
      }
      options.push({
        mode: mode,
        template: option.template,
        content: option.template.replace("{}", replace_text),
        range: option.range,
        value: value,
      })
    }
    this.setData({
      options: options,
      option_display: true,
      option_type: OPTION_TYPE.PICKER,
      send_state: "disabled"
    });
    this.scrollToBottom()
  },

  /**
   * Chat UI interactions.
   */
  onSingleCheck: function (e) {
    let id = parseInt(e.target.id)
    let option = this.data.options[id]
    this.setData({ 
      options: [],
      option_display: false })
    this.sendMessage(option.text, "user")
    this.loadMessage(option.next)
  },

  onMultiCheck: function (e) {
    let id = parseInt(e.target.id)
    let len = this.data.options.length
    // Toggle current selection.
    this.data.options[id].checked = !this.data.options[id].checked
    // Toggle other selections.
    for (let i = 0; i < len; i++) {
      if (this.data.options[id].exclusive != this.data.options[i].exclusive) {
        this.data.options[i].checked = false;
      }
    }
    // Refresh style.
    let checked = false;
    for (let i = 0; i < len; i++) {
      checked |= this.data.options[i].checked;
      this.data.options[i].class = this.data.options[i].checked ? "checked" : ""
    }
    this.data.send_state = checked ? "" : "disabled"
    this.setData({options: this.data.options, send_state: this.data.send_state})
  },

  onMultiSend: function (e) {
    if (this.data.option_state == "disabled") {
      return
    }
    this.resolveReaction(OPTION_TYPE.MULTI_SELECT, this.data.options)
      .then((res) => {
        console.log(res)
        this.setData({
          options: [],
          option_display: false
        })
        this.sendMessage(res.msg, "user")
        this.loadMessage(res.next)
      });
  },

  onPickerChange: function (e) {
    console.log(e);
    let id = parseInt(e.target.id);
    let picker = this.data.options[id];
    let value = e.detail.value;
    if (picker.mode == 'selector') {
      value = picker.range[value];
    }
    picker.content = picker.template.replace('{}', value);
    picker.class = "checked"
    this.data.options[id] = picker;
    let ready = true;
    for (let i = 0; i < this.data.options.length; i++) {
      if (this.data.options[i].class != "checked") {
        ready = false;
        break;
      }
    }
    this.setData({
      options: this.data.options,
      send_state: ready ? "" : "disabled"
    });
  },

  onPickerSend: function (e) {
    if (this.data.send_state == "disabled") {
      return
    }
    this.resolveReaction(OPTION_TYPE.PICKER, this.data.options)
      .then((res) => {
        this.setData({
          options: [],
          option_display: false
        })
        this.sendMessage(res.msg, "user");
        this.loadMessage(res.next);
      });
    return;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})