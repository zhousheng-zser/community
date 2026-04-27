# 通过 SSH 访问服务器上的文件
$sshCmd = "ssh -o StrictHostKeyChecking=no cw@192.168.110.50"

# 进入目录并查看文件
$safePath = "/home/cw/a/community-backend/问题统计测试准备"

# 使用 SSH 执行命令获取文件内容
$safeFile = "$safePath/Bug 记录文档.md"

# 尝试获取文件
& $sshCmd "cd '$safePath' 2>&1 || ls -la ~/a/community-backend/ | grep 问题"
