http-pip
===================================
校验过jwt后做简单转发

### 外部依赖
需要一个jwt服务
- get http://sevice.jwt/path?jwt=a.b.c 能返回校验结果
- get http://sevice.jwt/name.2 返回2天有效的sub=name的签名

修改main.go的secret部分(200+)后重新编译, 不要用别人的编译好的
```
cd jwtSrv
build-jwtSrv.sh 1.0.0
```

### 配置
样例参考config.dev.json, 完整说明在test-conf, 可以`node test-conf.js xxx.json`校验

### start
`npm start xxx.json`
