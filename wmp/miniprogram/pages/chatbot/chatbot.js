// miniprogram/pages/chatbot/chatbot.js
var chat = require('../../util/chat.js');
var database = require('../../util/database.js');

const TYPE = {
  SINGLE_SELECT: 'single',
  MULTI_SELECT: 'multiple',
  PICKER: 'picker',
  TEXT_INPUT: 'text_input'
};

const TIMEOUT_MSG_BEFORE = 0;
const TIMEOUT_MSG_AFTER_FACTOR = 0;
const PICKER_TEMP_TEXT = "___";

Page({

  /**
   * 页面的初始数据
   */
  data: {
    chat: [],
    option_display: false,
    option_type: 'multiple',
    options: [],
    send_state: "disabled",
    scrollTop: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    chat.loadChat().then(this.loadFromDbAndStart);
  },

  /**
   * Loads chat script config from db.
   */
  loadFromDbAndStart: function (stage) {
    let name = stage.name;
    let id = stage.id;
    database.loadChat(name, id, (chatflow, id)=>{
      this.chat_flow = chatflow;
      this.loadMessage(id);
    });
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
  resolveReaction: function (id, type, options) {
    return new Promise((resolve, reject) => {
      chat.resolveReaction(id, options).then((res) => {
        console.log(res)
        if (res.next == -1) {
          console.log("bbbb")
          res = this.resolveDefault(type, options)
        }
        resolve(res);
      })
    });
  },

  resolveDefault: function (type, options) {
    console.log(type)
    switch (type) {
      case TYPE.MULTI_SELECT:
        console.log("aaa")
        return this.resolveMultiSelect(options);
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
    if (id == -2) {
      return
    }
    let message = this.chat_flow[id]
    if (message.type == "CHATBOT") {
      this.addChatbotMessage(message.content[0])
    }
    else if (message.type == "USER") {
      switch(message.option_type) {
        case TYPE.SINGLE_SELECT:
          this.addSingleSelect(message.content)
          break
        case TYPE.MULTI_SELECT:
          this.addMultiSelect(message.content, id)
          break
        case TYPE.PICKER:
          this.addPicker(message.content, id)
          break
        default:
          break
      }
    }
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
      option_type: TYPE.SINGLE_SELECT
    })
    this.scrollToBottom()
  },

  addMultiSelect: function (content, id) {
    for (let i = 0; i < content.length; i++) {
      let option = content[i]
      this.data.options.push({
        content: option.option,
        text: option.text,
        unique: option.unique,
        next: option.next,
        checked: false
      })
    }
    this.setData({
      options: this.data.options,
      option_display: true,
      option_type: TYPE.MULTI_SELECT,
      option_id: id,
    })
    this.scrollToBottom()
  },

  addPicker: function (content, id) {
    this.setData({
      picker: {
        template: content.template,
        content: content.template.replace("{}", PICKER_TEMP_TEXT),
        range: content.range,
        value: content.index,
      },
      option_display: true,
      option_type: TYPE.PICKER,
      option_id: id
    })
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
      if (this.data.options[id].unique != this.data.options[i].unique) {
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
    this.resolveReaction(this.data.option_id, TYPE.MULTI_SELECT, this.data.options)
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
    let index = e.detail.value
    let content = this.data.picker.template.replace('{}', this.data.picker.range[index])
    this.data.picker.value = index
    this.data.picker.content = content
    this.data.picker.class = "checked"
    this.data.picker.selected = true
    this.setData({
      picker: this.data.picker,
      send_state: true
    })
  },

  onPickerSend: function (e) {
    if (!this.data.picker.selected) {
      return
    }
    this.sendMessage(this.data.picker.content, "user")
    this.setData({
      picker: {},
      option_display: false
    })
    let res = this.getOptionCallback(this.data.option_id)(this.data.picker.value)
    this.loadMessage(res.next)
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