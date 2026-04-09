/**
 * 社区功能全链路验证脚本 (test_community.js)
 * 用途：模拟小程序端从登录到互动的完整闭环，验证云端接口。
 * 运行方式：node test_community.js
 */

const axios = require('axios');

// 配置区
const BASE_URL = 'http://8.140.204.254:3000/api/v1';

// [重要] 如果模拟登录失败（因为需要真实微信 code），请手动从小程序开发者工具的 Storage 中复制 token 填入此处
const MANUAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwib3BlbmlkIjoib3IwVmYzUmxWTG96VExLVWhScVYwbjlfZUFsNCIsImlhdCI6MTc3MzI4OTYyMiwiZXhwIjoxNzczODk0NDIyfQ.6Y22Xy-KjHBbz-11oyzR9uS3o1amVSyRs3KCmIX6PLc';

async function runTest() {
    console.log('🚀 开始社区功能全链路验证...');
    let token = MANUAL_TOKEN;
    let testPostId = '';

    try {
        // 1. 登录验证 (如果没提供 manual token)
        if (!token) {
            console.log('\n[步骤1] 正在模拟登录 (使用 mock code)...');
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                code: 'test_mock_code_123',
                nickname: '测试助手',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test'
            }).catch(err => {
                console.log('⚠️  模拟登录失败 (正常现象，需真实微信 code)。');
                console.log('💡  建议：请从小程序开发者工具获取 token 并填入 MANUAL_TOKEN 变量中再运行。');
                throw err;
            });
            token = loginRes.data.data ? loginRes.data.data.token : loginRes.data.token;
            console.log('✅ 登录成功，获取 Token:', token.substring(0, 15) + '...');
        } else {
            console.log('\n[步骤1] 使用手动提供的 Token 进行验证...');
        }
        console.log('✅ 登录成功，获取 Token:', token.substring(0, 15) + '...');

        const authHeader = { headers: { 'Authorization': `Bearer ${token}` } };

        // 2. 发帖验证 - 发布多条以填充页面
        const postsToCreate = [
            { category: '热门话题', content: '今天的天气真不错，适合出门走走！ #生活随笔', images: ['/uploads/mock_img_1.jpg'] },
            { category: '热门活动', content: '本周末社区有一场义诊活动，欢迎大家参加！ #活动预告', images: [] },
            { category: '邻里互动', content: '谁家的小猫丢了？在三号楼楼下转悠呢。 #寻物启事', images: ['/uploads/mock_img_2.jpg'] },
            { category: '热门话题', content: '分享一个简单好做的家常菜谱... #美食分享', images: ['/uploads/mock_img_1.jpg', '/uploads/mock_img_2.jpg'] },
            { category: '邻里互动', content: '万能的朋友圈，求推荐周边的靠谱家政。 #求助', images: [] }
        ];

        console.log(`\n[步骤2] 正在模拟发布推文 (共 ${postsToCreate.length} 条)...`);
        for (let i = 0; i < postsToCreate.length; i++) {
            const p = postsToCreate[i];
            const res = await axios.post(`${BASE_URL}/posts`, {
                content: p.content,
                category: p.category,
                location: '社区周边',
                images: p.images
            }, authHeader);
            if (i === postsToCreate.length - 1) {
                testPostId = res.data.data ? res.data.data.id : res.data.id;
            }
            console.log(` - 已发布: [${p.category}] ${p.content.substring(0, 10)}...`);
        }
        console.log('✅ 批量发布完成');

        // 3. 列表获取验证 (全量)
        console.log('\n[步骤3] 正在获取全量社区列表...');
        const listAllRes = await axios.get(`${BASE_URL}/posts`);
        const allPosts = listAllRes.data.data || listAllRes.data;
        console.log(`✅ 全量列表拉取成功，共 ${allPosts.length} 条数据`);
        
        if (allPosts.length > 0) {
            console.log('🧐 第一个帖子的原始字段结构:', JSON.stringify(Object.keys(allPosts[0])));
            console.log('🧐 第一个帖子的完整数据对象:', JSON.stringify(allPosts[0]));
            const categoryVal = allPosts[0].category || allPosts[0].tab || '未找到 category/tab 字段';
            console.log('🧐 第一个帖子的分类字段值:', categoryVal);
        }

        // 3.1 分类过滤验证
        console.log('\n[步骤3.1] 正在测试分类过滤: [热门话题]');
        const listHotRes = await axios.get(`${BASE_URL}/posts`, { params: { category: '热门话题' } });
        const hotPosts = listHotRes.data.data || listHotRes.data.list || listHotRes.data;
        console.log(`✅ [热门话题] 分类返回 ${Array.isArray(hotPosts) ? hotPosts.length : (hotPosts.list ? hotPosts.list.length : 0)} 条数据`);

        // 4. 点赞验证
        console.log('\n[步骤4] 正在对帖子进行点赞...');
        const likeRes = await axios.post(`${BASE_URL}/posts/${testPostId}/like`, {}, authHeader);
        console.log('✅ 点赞成功，当前状态:', likeRes.data.status || 'Success');

        // 5. 评论验证
        console.log('\n[步骤5] 正在发表评论...');
        const commentRes = await axios.post(`${BASE_URL}/posts/${testPostId}/comment`, {
            content: '脚本自动评论：这条动态很棒！'
        }, authHeader);
        console.log('✅ 评论成功:', commentRes.data.content || 'Success');

        console.log('\n✨ 所有步骤验证通过！社区功能联调成功。');

    } catch (error) {
        console.error('\n❌ 验证过程中发生错误:');
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('错误明细:', error.response.data);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
}

runTest();
