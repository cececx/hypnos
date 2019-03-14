// miniprogram/pages/chatbot/chatbot.js
var MS_SLEEP_IMPROVE_ID = 13
var MS_SLEEP_IMPROVE_NEXT = 14
var PK_SLEEP_LENGTH_ID = 21
var PK_SLEEP_LENGTH_NEXT = 22
var TIMEOUT_MSG_BEFORE = 0
var TIMEOUT_MSG_AFTER_FACTOR = 0
var PICKER_TEMP_TEXT = "___"

Page({

  /**
   * 页面的初始数据
   */
  data: {
    chat: [],
    option_display: false,
    option_type: 'picker',
    options: [],
    send_state: "disabled",
    picker: {
      template: "我想要每天睡 {} 小时",
      content: "我想要每天睡 ___ 小时",
      range: ["6", "7", "8", "9", "10"],
      value: 2,
      selected: false
    },
    scrollTop: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadFromDbAndStart("main", 0)
  },

  /**
   * Loads chat script config from db.
   */
  loadFromDbAndStart: function (name, id) {
    const db = wx.cloud.database()
    db.collection('chatflow').where({
      name: name
    }).get({
      success: res => {
        this.chat_flow = res.data[0]
        this.loadMessage(id)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '连接失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },

  getOptionCallback: function (id) {
    switch (id) {
      case MS_SLEEP_IMPROVE_ID: return this.callbackSleepImprovement
      case PK_SLEEP_LENGTH_ID: return this.callbackSleepLength
      default: console.error("Failed to get callback for node ", id)
    }
  },

  callbackSleepImprovement: function (content, checks) {
    let lines = []
    for (let i = 0; i < content.length; i++) {
      if (checks[i]) {
        lines.push(content[i])
      }
    }
    return {
      next: MS_SLEEP_IMPROVE_NEXT,
      text: lines.join("，")
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
    console.log(id)
    if (id == -1) {
      return
    }
    let message = this.chat_flow[id]
    console.log(message)
    if (message.type == "CHATBOT") {
      this.addChatbotMessage(message.content[0])
    }
    else if (message.type == "USER") {
      switch(message.option_type) {
        case "single":
          this.addSingleSelect(message.content)
          break
        case "multiple":
          this.addMultiSelect(message.content, id)
          break
        case "picker":
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
      option_type: "single"
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
      })
    }
    this.setData({
      options: this.data.options,
      option_display: true,
      option_type: 'multiple',
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
      option_type: 'picker',
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
    let contents = []
    let check = []
    for (let i = 0; i < this.data.options.length; i++) {
      contents.push(this.data.options[i].text)
      check.push(this.data.options[i].checked)
    }
    let res = this.getOptionCallback(this.data.option_id)(contents, check)
    this.setData({ 
      options: [], 
      option_display: false
    })
    this.sendMessage(res.text, "user")
    this.loadMessage(res.next)
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