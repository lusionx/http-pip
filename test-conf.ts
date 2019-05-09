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
            title: 'default proxy_pass',
            type: 'string',
            pattern: '^http:\/\/'
        },
        rules: {
            title: 'rule of proxy',
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
                },
            },
        }
    }
}


process.nextTick(async () => {
    console.log(process.argv)
    const config = JSON.parse(readFileSync(process.argv[2], { encoding: 'utf8' }))
    const res = validateResult(config, configSchema)
    if (!res.valid) {
        console.log(res)
    }
})

process.on("unhandledRejection", (error: any) => {
    const { response, config } = error
    if (config && response) {
        return console.error({ config, data: response.data })
    }
    console.error(error)
})
