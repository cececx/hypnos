//app.js
App({
  onLaunch: function () {
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }

    this.globalData = {
      user: {
        profile: {},
        progress: {}
      },
      checkIn: [{
        date: "3/23 星期六",
        sleepTime: "23:30",
        wakeUpTime: "08:30",
        sleepStatus: [0],
        wakeUpStatus: [0],
        dayTimeStatus: [],
        activities: ["牛奶", "咖啡", "瑜伽"],
        problems: [4],
      },{
        date: "3/22 星期五",
        sleepTime: "23:30",
        wakeUpTime: "08:30",
        sleepStatus: [0],
        wakeUpStatus: [0],
        dayTimeStatus: [],
        activities: ["玩手机"],
        problems: [4],
      },{
        date: "3/21 星期四",
        sleepTime: "23:30",
        wakeUpTime: "08:30",
        sleepStatus: [0],
        wakeUpStatus: [0],
        dayTimeStatus: [],
        activities: ["奶茶", "玩手机"],
        problems: [4],
      }],
      preset: {
        sleepStatus: {
          0: { content: "不错" },
          1: { content: "一般" },
          2: { content: "糟糕" },
        },
        wakeUpStatus: {
          0: { content: "觉得很舒服清爽" },
          1: { content: "不好也不坏" },
          2: { content: "很困，很难清醒过来" },
          3: { content: "眼睛不适" },
          4: { content: "头昏或头痛" },
          5: { content: "胸闷难受" },
        },
        dayTimeStatus: {
          0: { content: "一切都很好" },
          1: { content: "心情很不好" },
          2: { content: "做事情效率不高" },
          3: { content: "头痛" },
          4: { content: "头晕" },
          5: { content: "犯困" },
        },
        activities: {
          0: { content: "咖啡", type: ["caffeine"] },
          1: { content: "茶", type: ["caffeine"] },
          2: { content: "奶茶", type: ["caffeine"] },
          3: { content: "超过半小时的午睡" },
          4: { content: "有氧运动" },
          5: { content: "无氧运动" },
          6: { content: "比较大的情绪波动" },
        },
        problems: {
          0: { content: "很久无法入睡" },
          1: { content: "因为玩手机无法按时入睡" },
          3: { content: "因为学习工作等原因无法按时入睡" },
          4: { content: "没有困难" },
        }
      }
    }
  }
})
