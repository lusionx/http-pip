import { createServer, IncomingMessage, ServerResponse } from 'http'
import { readFileSync } from 'fs'
import { URL } from 'url'
import axios from 'axios'
import { getJwtHeader, JwtUser, getJwtQuery, pass, Rule, passOption } from './lib'

let config: Bind
async function listener(req: IncomingMessage, res: ServerResponse) {
    const { headers, url: oriUrl, method } = req
    const oriLoc = new URL('http://127.0.0.1' + oriUrl)
    const { hostname, port, url, users } = passOption(oriLoc.pathname, config.rules, config.pass)
    if (users && users.length && config.jwtSrv) {
        // 做jwt验证
        let jwt: string = ''
        if (!jwt && config.jwtSrv.fromHeader) {
            jwt = getJwtHeader(config.jwtSrv.fromHeader, headers as any)
        }
        if (!jwt && config.jwtSrv.fromQuery) {
            jwt = getJwtQuery(config.jwtSrv.fromQuery, oriLoc.search)
        }
        function end(code: number) {
            res.writeHead(code)
            return res.end()
        }
        if (!jwt) return end(401)
        const resp = await axios.get<JwtUser>(config.jwtSrv.url, { params: { jwt } })
        if (!resp.data.sub) return end(403)
        if (!users.includes(resp.data.sub)) return end(403)
    }
    const pxy = await pass({
        hostname, port, method, headers,
        path: url + oriLoc.search
    })
    res.writeHead(pxy.statusCode || 500, pxy.headers)
    pxy.pipe(res)
}

interface Bind {
    port: number
    pass: string
    rules: Rule[]
    jwtSrv: {
        fromHeader: string
        fromQuery: string
        url: string
    }
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
