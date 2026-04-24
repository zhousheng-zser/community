const http = require('http');

function testConnection(ip, port, path = '/health') {
    return new Promise((resolve) => {
        console.log(`\n测试: ${ip}:${port}${path}`);
        
        const req = http.request({
            hostname: ip,
            port: port,
            path: path,
            method: 'GET',
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✅ 状态码: ${res.statusCode}`);
                console.log(`响应: ${data.substring(0, 200)}`);
                resolve({ success: res.statusCode === 200, statusCode: res.statusCode, data });
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ 错误: ${err.message}`);
            resolve({ success: false, error: err.message });
        });
        
        req.on('timeout', () => {
            console.log('❌ 超时');
            req.destroy();
            resolve({ success: false, error: 'Timeout' });
        });
        
        req.end();
    });
}

async function main() {
    console.log('========================================');
    console.log('  测试后端服务连通性');
    console.log('========================================');
    
    const IP = '192.168.110.50';
    
    // Test port 3000
    const result1 = await testConnection(IP, 3000, '/health');
    
    // Test port 3000 API
    if (result1.success || result1.statusCode) {
        await testConnection(IP, 3000, '/api/v1/core/banners');
        await testConnection(IP, 3000, '/api/v1/core/categories');
    }
    
    // Test port 3001
    const result2 = await testConnection(IP, 3001, '/health');
    
    // Test port 3001 API
    if (result2.success || result2.statusCode) {
        await testConnection(IP, 3001, '/api/v1/core/banners');
    }
    
    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================');
}

main();
