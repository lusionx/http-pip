import { RequestOptions, IncomingMessage, request } from "http"
import * as Qs from 'querystring'
import { URL } from "url";

export function pass(opt: RequestOptions) {
    return new Promise<IncomingMessage>((res, rej) => {
        const client = request(opt, res)
        client.end()
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