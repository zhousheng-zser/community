const http = require('http');

const BASE_URL = 'http://120.27.239.244:3001:3001';
const results = [];

function testImage(path) {
    return new Promise((resolve) => {
        const encodedPath = encodeURI(path);
        const req = http.request({
            hostname: '120.27.239.244:3001',
            port: 3001,
            path: encodedPath,
            method: 'GET',
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const ok = res.statusCode === 200;
                results.push({ path, ok, size: data.length });
                resolve({ path, status: res.statusCode, size: data.length, ok });
            });
        });
        req.on('error', (err) => {
            results.push({ path: path, ok: false, error: err.message });
            resolve({ path, error: err.message });
        });
        req.on('timeout', () => {
            req.destroy();
            results.push({ path: path, ok: false, error: 'Timeout' });
            resolve({ path, error: 'Timeout' });
        });
        req.end();
    });
}

async function test() {
    console.log('========================================');
    console.log('  测试图片资源访问');
    console.log('========================================\n');

    // 测试 service_home3 目录
    console.log('【service_home3 图片】');

    // 测试首页
    let r = await testImage('/uploads/service_home3/上门手机维修.png');
    console.log(`${r.ok ? '✅' : '❌'} 上门手机维修.png - ${r.status || r.error}`);

    r = await testImage('/uploads/service_home3/净水器故障维修.png');
    console.log(`${r.ok ? '✅' : '❌'} 净水器故障维修.png - ${r.status || r.error}`);

    r = await testImage('/uploads/service_home3/洗衣机维修.png');
    console.log(`${r.ok ? '✅' : '❌'} 洗衣机维修.png - ${r.status || r.error}`);

    // 测试惠民卡图片
    console.log('\n【惠民卡图片】');

    r = await testImage('/uploads/benefit_alliance/jd-alliance.png');
    console.log(`${r.ok ? '✅' : '❌'} jd-alliance.png - ${r.status || r.error}`);

    r = await testImage('/uploads/benefit_alliance/pdd-alliance.png');
    console.log(`${r.ok ? '✅' : '❌'} pdd-alliance.png - ${r.status || r.error}`);

    // 测试首页轮播图
    console.log('\n【首页图片】');

    r = await testImage('/img/home-0.png');
    console.log(`${r.ok ? '✅' : '❌'} home-0.png - ${r.status || r.error}`);

    r = await testImage('/img/home_categories/tidy.png');
    console.log(`${r.ok ? '✅' : '❌'} tidy.png - ${r.status || r.error}`);

    // 汇总
    console.log('\n========================================');
    console.log('  测试结果汇总');
    console.log('========================================');

    const ok = results.filter(r => r.ok).length;
    const fail = results.filter(r => !r.ok).length;

    console.log(`✅ 可访问: ${ok}`);
    console.log(`❌ 不可访问: ${fail}`);
    console.log(`📊 总计: ${results.length}`);
}

test().catch(console.error);
