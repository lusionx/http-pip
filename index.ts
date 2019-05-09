import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { URL } from 'url'
import axios from 'axios'
import { JwtUser, pass, Rule, passOption, JwtSrv, getJwtVal } from './lib'

let config: Bind
async function listener(req: IncomingMessage, res: ServerResponse) {
    const { headers, url: oriUrl, method } = req
    const oriLoc = new URL('http://127.0.0.1' + oriUrl)
    const { hostname, port, url, users } = passOption(oriLoc.pathname, config.rules, config.pass)
    if (users && users.length && config.jwtSrv) {
        // 做jwt验证
        let jwt = getJwtVal(config.jwtSrv, oriLoc.search, headers)
        function end(code: number) {
            res.writeHead(code)
            return res.end()
        }
        if (!jwt) return end(401)
        // 希望 jwtSrv 出错时会连带本服务也挂
        const resp = await axios.get<JwtUser>(config.jwtSrv.url, { params: { jwt } })
        if (!resp.data.sub || !users.includes(resp.data.sub)) return end(403)
    }
    pass({
        hostname, port, method, headers,
        path: url + oriLoc.search
    }, req.readableLength ? req : undefined).then(pxy => {
        res.writeHead(pxy.statusCode || 500, pxy.headers)
        pxy.pipe(res)
    }).catch((err: Error) => {
        res.writeHead(502, {
            'Content-Length': err.message.length,
            'Content-Type': 'text/plain',
        })
        res.write(err.message)
        res.end()
    })
}

interface Bind {
    port: number
    pass: string
    rules: Rule[]
    jwtSrv: JwtSrv
}

process.nextTick(async () => {
    config = JSON.parse(readFileSync(process.argv[2] || './config.dev.json', { encoding: 'utf8' }))
    createServer(listener).listen(config.port)
    console.log('listen http://127.0.0.1:' + config.port)
})

process.on("unhandledRejection", (error: any) => {
    const { response, config } = error
    if (config && response) {
        return console.error({ config, data: response.data })
    }
    console.error(error)
})
