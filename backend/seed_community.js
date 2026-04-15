require('dotenv').config();
const { sequelize, User, Post, Comment } = require('./src/models');

const TAB_TYPES = ['热门话题', '热门活动', '邻里互动'];

const TOPIC_CONTENT = [
    { title: "小区停车难怎么破？", desc: "每天晚上下班回来都在地下车库绕半天，有谁知道物业到底什么时候规划带充电桩的新车位吗？", images: "[]" },
    { title: "发现一家超好吃的螺蛳粉", desc: "在南门那条街新开的，昨晚去试了一下又臭又香，配料给的特别足！", images: "[\"/img/placeholders/home_cleaning.png\"]" },
    { title: "周末闲置物品交换会", desc: "我家小孩买了很多积木玩具没玩过，想找小区里有需要的人换两本英语启蒙书~", images: "[]" }
];

const EVENT_CONTENT = [
    { title: "夏日水枪大作战——社区亲子活动", desc: "下周六下午由物业牵头在中央喷泉广场举办水枪战，备有西瓜凉茶，欢迎各位带小孩一起来玩！千万别让孩子中暑啦。", images: "[\"/img/placeholders/home_cleaning.png\"]" },
    { title: "迎中秋：一起手工做月饼", desc: "社区居委会将在活动室组织中秋手工月饼制作活动，材料全部免费发！赶快在群里报名", images: "[]" },
    { title: "环保回收月", desc: "这个月的主题是废旧家电回收，只要把不要的小电器拿到指定摊位就能换取积分哦～", images: "[]" }
];

const NEIGHBOR_CONTENT = [
    { title: "寻物启事：一只蓝猫", desc: "昨天下午跑出去了，平时很胆小，如果有谁在楼道看到麻烦联系我，必有重谢！！", images: "[]" },
    { title: "借个电钻用用", desc: "刚搬来这栋，想在墙上打几个洞安架子，请问谁家方便借下工具吗？非常感谢~", images: "[]" },
    { title: "我家今晚做了红烧肉", desc: "做了太多吃不完，有哪位正好没做饭的邻居愿意端碗过来装点回去吃？（虽然卖相不好但味道很赞哈）", images: "[\"/img/placeholders/home_cleaning.png\"]" }
];

async function seedCommunity() {
    try {
        console.log("Starting Community seeding...");

        // Disable checks temporarily
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });

        // Grab all users created previously
        const users = await User.findAll({ limit: 10 });
        if (users.length === 0) {
            console.error("No users found. Please run seed_chat.js first to populate users.");
            process.exit(1);
        }

        // Drop old posts & comments
        await Post.destroy({ truncate: true, cascade: true });
        await Comment.destroy({ truncate: true, cascade: true });

        console.log("Old posts cleared.");

        // Helper function to pick a random item
        const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
        // Helper function to pick random users
        const randUser = () => randItem(users);

        for (let i = 0; i < 30; i++) {
            // evenly distribute 10 posts for each tab
            let tabIndex = i % 3;
            let categoryName = TAB_TYPES[tabIndex];

            let dataset;
            if (tabIndex === 0) dataset = TOPIC_CONTENT;
            else if (tabIndex === 1) dataset = EVENT_CONTENT;
            else dataset = NEIGHBOR_CONTENT;

            let specificContent = randItem(dataset);
            let author = randUser();

            let post = await Post.create({
                user_id: author.id,
                content: JSON.stringify({ title: specificContent.title, desc: specificContent.desc }), // matching frontend structure slightly
                images: JSON.parse(specificContent.images),
                category: categoryName
            });

            // random number of likes & comments (mocking counts initially without generating distinct Comment rows to simplify verification, but creating a few actual comments too)
            let commentCount = Math.floor(Math.random() * 5);
            for (let j = 0; j < commentCount; j++) {
                await Comment.create({
                    post_id: post.id,
                    user_id: randUser().id,
                    content: "支持一下！写的很好哦"
                });
            }
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
        console.log("Community seeding completed flawlessly!");
        process.exit(0);

    } catch (e) {
        console.error("Critical Seeding Error:", e);
        process.exit(1);
    }
}

seedCommunity();
