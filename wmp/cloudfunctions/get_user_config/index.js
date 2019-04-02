const cloud = require('wx-server-sdk')

const USER_TABLE = "user";

cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const openid = cloud.getWXContext().OPENID;

  try {
    let res = await db.collection(USER_TABLE).doc(openid).get();
    return res.data.profile;
  } catch (err) {
    return {};
  }
}