const http = require('http');

function makeRequest(port, path = '/health') {
    return new Promise((resolve, reject) => {
        console.log(`\n测试端口 ${port} - ${path}`);
        
        const options = {
            hostname: '114.55.167.14',
            port: port,
            path: path,
            method: 'GET',
            timeout: 10000,
            headers: {
                'Host': '114.55.167.14',
                'User-Agent': 'Mozilla/5.0'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`✓ 状态码: ${res.statusCode}`);
                if (data.length < 1000) {
                    console.log(`响应: ${data}`);
                } else {
                    console.log(`响应长度: ${data.length} 字符`);
                }
                resolve({ port, path, statusCode: res.statusCode, data });
            });
        });

        req.on('error', (error) => {
            console.log(`✗ 错误: ${error.message}`);
            reject(error);
        });

        req.on('timeout', () => {
            console.log('✗ 请求超时');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

async function runTests() {
    console.log('========================================');
    console.log('  服务器接口测试');
    console.log('========================================');

    // 测试3000端口
    try {
        await makeRequest(3000, '/health');
    } catch (e) {
        console.log('端口3000健康检查失败');
    }

    // 测试80端口
    try {
        await makeRequest(80, '/');
    } catch (e) {
        console.log('端口80根路径测试失败');
    }

    // 测试80端口的API
    try {
        await makeRequest(80, '/api/v1/core/banners');
    } catch (e) {
        console.log('端口80 API测试失败');
    }

    console.log('\n========================================');
    console.log('测试完成');
    console.log('========================================');
}

runTests().catch(console.error);
