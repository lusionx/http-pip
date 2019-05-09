import { createServer, IncomingMessage, ServerResponse, request, RequestOptions } from 'http'
import { readFileSync } from 'fs'
import { URL } from 'url'

function pass(opt: RequestOptions) {
    return new Promise<IncomingMessage>((res, rej) => {
        const client = request(opt, res)
        client.end()
    })
}

let config: Bind
async function listener(req: IncomingMessage, res: ServerResponse) {
    const { headers, url: path, method } = req
    const { hostname, port, url } = (function (pp: string) {
        const mrl = config.rules.find(e => pp.startsWith(e.location))
        if (mrl) {
            const loc = new URL(mrl.pass)
            const { hostname, port } = loc
            let url = loc.pathname + pp
            if (loc.pathname.endsWith('/')) {
                url = loc.pathname.slice(0, -1) + pp.slice(mrl.location.length)
            }
            return { hostname, port, url }
        } else {
            const loc = new URL(config.pass)
            const { hostname, port } = loc
            return { hostname, port, url: pp }
        }
    })(path || '/')
    const pxy = await pass({
        hostname, port, method, headers,
        path: url,
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
    }[]
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
