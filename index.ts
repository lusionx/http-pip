import { createServer, IncomingMessage, ServerResponse, request, RequestOptions } from 'http'
import { readFileSync } from 'fs'
import { URL } from 'url'
import axios from 'axios'
import * as Qs from 'querystring'


function pass(opt: RequestOptions) {
    return new Promise<IncomingMessage>((res, rej) => {
        const client = request(opt, res)
        client.end()
    })
}

interface JwtUser {
    sub: string
    exp: number
    iat: number
}

function getJwtHeader(key: string, headers: Record<any, string>) {
    const v = headers[config.jwtSrv.fromHeader]
    if (v) {
        const bea = 'Bearer '
        if (v.startsWith(bea)) {
            return v.slice(bea.length)
        } else {
            return v
        }
    }
    return ''
}

function getJwtQuery(key: string, search: string) {
    const v = Qs.parse(search ? search.slice(1) : '')[key] as string
    return v || ''
}

let config: Bind
async function listener(req: IncomingMessage, res: ServerResponse) {
    const { headers, url: oriUrl, method } = req
    const oriLoc = new URL('http://127.0.0.1' + oriUrl)
    const { hostname, port, url, users } = (function (pp: string) {
        const mrl = config.rules.find(e => pp.startsWith(e.location))
        const users = mrl ? mrl.users : []
        if (mrl) {
            const loc = new URL(mrl.pass)
            const { hostname, port } = loc
            let url = loc.pathname + pp
            if (loc.pathname.endsWith('/')) {
                url = loc.pathname.slice(0, -1) + pp.slice(mrl.location.length)
            }
            return { hostname, port, url, users }
        } else {
            const loc = new URL(config.pass)
            const { hostname, port } = loc
            return { hostname, port, url: pp, users }
        }
    })(oriLoc.pathname)
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
    rules: {
        location: string
        pass: string
        users: string[]
    }[]
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
