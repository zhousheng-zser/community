const http = require('http');

const BASE_URL = 'http://jshsp1.eds-tech.cn:3001';
const API = `${BASE_URL}/api/v1`;
const results = [];

function request(method, path, body = null) {
    return new Promise((resolve) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: json });
                } catch {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => resolve({ statusCode: 0, error: err.message }));
        req.on('timeout', () => { req.destroy(); resolve({ statusCode: 0, error: 'Timeout' }); });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

function log(testName, result) {
    const pass = result.statusCode === 200 && (
        !result.data ||
        result.data.errno === 0 ||
        result.data.code === 0 ||
        result.data.message === '获取成功' ||
        result.data.message
    );
    const icon = pass ? '✅' : '❌';
    results.push({ name: testName, pass });
    console.log(`${icon} ${testName}`);
    if (result.statusCode !== 200) {
        console.log(`   状态码: ${result.statusCode}`);
    }
    if (result.data && typeof result.data === 'object' && Object.keys(result.data).length < 10) {
        console.log(`   响应: ${JSON.stringify(result.data).substring(0, 300)}`);
    }
    return result;
}

async function test() {
    console.log('========================================');
    console.log('  社区小程序 API 接口测试');
    console.log('========================================\n');

    // ===== 1. 首页模块 =====
    console.log('【首页模块测试】');

    let r = await request('GET', '/api/v1/core/banners');
    r = log('获取轮播图', r);

    r = await request('GET', '/api/v1/core/categories');
    r = log('获取服务分类', r);

    r = await request('GET', '/api/v1/core/services/hot');
    r = log('获取热门服务', r);

    r = await request('GET', '/api/v1/core/services');
    r = log('获取服务列表', r);

    r = await request('GET', '/api/v1/core/workers');
    r = log('获取技工列表', r);

    r = await request('GET', '/api/v1/core/service-providers');
    r = log('获取服务商列表', r);

    // ===== 2. 集市模块 =====
    console.log('\n【集市模块测试】');

    r = await request('GET', '/api/v1/market/shops');
    r = log('获取店铺列表', r);

    r = await request('GET', '/api/v1/market/search', { keyword: '测试' });
    r = log('搜索商品/店铺', r);

    // ===== 3. 社区模块 =====
    console.log('\n【社区模块测试】');

    r = await request('GET', '/api/v1/posts');
    r = log('获取帖子列表', r);

    r = await request('GET', '/api/v1/posts?category=热门话题');
    r = log('获取热门话题帖子', r);

    // ===== 4. 邻里帮帮模块 =====
    console.log('\n【邻里帮帮模块测试】');

    r = await request('GET', '/api/v1/neighbor-assist/orders/public');
    r = log('获取公开帮帮订单', r);

    // ===== 5. 惠民卡模块 =====
    console.log('\n【惠民卡模块测试】');

    r = await request('GET', '/api/v1/benefit/display');
    r = log('获取惠民卡展示', r);

    r = await request('GET', '/api/v1/jd/benefit/goods');
    r = log('获取京东联盟商品', r);

    r = await request('GET', '/api/v1/pdd/benefit/goods');
    r = log('获取拼多多联盟商品', r);

    // ===== 6. 需要登录的接口（测试返回401） =====
    console.log('\n【需要认证的接口测试】');

    r = await request('GET', '/api/v1/user/profile');
    r = log('获取用户信息(未登录)', r);
    console.log(`   预期返回401: ${r.statusCode === 401 ? '✅正确' : '❌错误'}`);

    r = await request('GET', '/api/v1/market/orders');
    r = log('获取我的订单(未登录)', r);
    console.log(`   预期返回401: ${r.statusCode === 401 ? '✅正确' : '❌错误'}`);

    r = await request('POST', '/api/v1/posts');
    r = log('发布帖子(未登录)', r);
    console.log(`   预期返回401: ${r.statusCode === 401 ? '✅正确' : '❌错误'}`);

    // ===== 汇总 =====
    console.log('\n========================================');
    console.log('  测试结果汇总');
    console.log('========================================');

    const pass = results.filter(r => r.pass).length;
    const fail = results.filter(r => !r.pass).length;

    console.log(`✅ 通过: ${pass}`);
    console.log(`❌ 失败: ${fail}`);
    console.log(`📊 总计: ${results.length}`);

    if (fail > 0) {
        console.log('\n失败的测试项:');
        results.filter(r => !r.pass).forEach(r => console.log(`  - ${r.name}`));
    }
}

test().catch(console.error);
