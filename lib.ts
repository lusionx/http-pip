import { RequestOptions, IncomingMessage, request } from "http"
import * as Qs from 'querystring'
import { URL } from "url"
import { Readable } from "stream"

export function pass(opt: RequestOptions, stream?: Readable) {
    return new Promise<IncomingMessage>((res, rej) => {
        const req = request(opt, res)
        stream ? stream.pipe(req) : req.end()
        req.on('error', rej)
    })
}

/**
 * @deprecated
 * @param url
 * @param qs 忽略url自带的qs, 用此值
 */
function reqGetText<T>(url: string, qs?: any) {
    const loc = new URL(url)
    const { hostname, port } = loc
    const path = qs ? [loc.pathname, '?', Qs.stringify(qs)].join('') : loc.pathname + loc.search
    return new Promise<{ statusCode?: number, data: T }>((res, rej) => {
        const req = request({ hostname, port, path }, (resp) => {
            const data: string = resp.read().toString()
            const { statusCode } = resp
            res({ statusCode, data: JSON.parse(data) })
        })
    })
}

export interface JwtUser {
    sub: string
    exp: number
    iat: number
}

export interface Rule {
    location: string
    pass: string
    users: string[]
}

export interface JwtSrv {
    fromHeader: string
    fromQuery: string
    url: string
}

export function getJwtHeader(key: string, headers: Record<any, string>) {
    const v = headers[key]
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

export function getJwtQuery(key: string, search: string) {
    const v = Qs.parse(search ? search.slice(1) : '')[key] as string
    return v || ''
}

export function getJwtVal(jwtSrv: JwtSrv, search: string, headers: any) {
    let jwt: string = ''
    if (!jwt && jwtSrv.fromHeader) {
        jwt = getJwtHeader(jwtSrv.fromHeader, headers)
    }
    if (!jwt && jwtSrv.fromQuery) {
        jwt = getJwtQuery(jwtSrv.fromQuery, search)
    }
    return jwt
}

export function passOption(pp: string, rules: Rule[], pass: string) {
    const mrl = rules.find(e => pp.startsWith(e.location))
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
        const loc = new URL(pass)
        const { hostname, port } = loc
        return { hostname, port, url: pp, users }
    }
}
