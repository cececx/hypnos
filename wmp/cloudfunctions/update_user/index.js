const cloud = require('wx-server-sdk')

const USER_TABLE = "user";

cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID;

  try {
    await db.collection(USER_TABLE).doc(openid).get();
  } catch (err) {
    if (err.errCode == -1) {
      try {
        console.log("Creating doc for openid ", openid);
        await db.collection(USER_TABLE).add({
          data: {
            _id: openid
          }
        })
      } catch (err) {
        console.log("Failed to create doc for openid ", openid);
      }
    }
  }
  return await db.collection(USER_TABLE).doc(openid).update({ data: event.data });
}