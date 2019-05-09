import { validateResult } from 'tv4'
import { readFileSync } from 'fs'


const configSchema = {
    type: 'object',
    required: ['pass', 'port', 'rules'],
    properties: {
        port: {
            title: 'binding port',
            type: 'number',
            minimum: 1024,
            maximum: 65535,
        },
        pass: {
            title: 'default proxy_pass ignore path',
            type: 'string',
            pattern: '^http:\/\/'
        },
        rules: {
            title: 'rules of proxy',
            type: 'array',
            minItems: 1,
            items: {
                type: 'object',
                required: ['location', 'pass'],
                properties: {
                    location: {
                        title: 'prefix',
                        type: 'string',
                        pattern: '^\/[a-zA-z0-9]+$',
                    },
                    pass: {
                        title: 'proxy_pass location',
                        type: 'string',
                        pattern: '^http:\/\/'
                    },
                    users: {
                        title: "jwt sub value list",
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'string',
                            minLength: 3,
                        }
                    }
                },
            },
        },
        jwtSrv: {
            title: 'valid users of matched rule',
            required: ['url'],
            properties: {
                fromQuery: {
                    title: 'jwt key of query',
                    type: 'string',
                    minLength: 3,
                },
                fromHeader: {
                    title: 'jwt key of header',
                    type: 'string',
                    minLength: 3,
                },
                url: {
                    title: 'jwt service url, resp{sub, exp, iat}',
                    type: 'string',
                    pattern: '^http:\/\/'
                },
            }
        }
    }
}


process.nextTick(async () => {
    const config = JSON.parse(readFileSync(process.argv[2], { encoding: 'utf8' }))
    const res = validateResult(config, configSchema)
    if (!res.valid) {
        console.log(res)
    } else {
        console.log(process.argv[2], 'valid')
    }
})

process.on("unhandledRejection", (error: any) => {
    const { response, config } = error
    if (config && response) {
        return console.error({ config, data: response.data })
    }
    console.error(error)
})
