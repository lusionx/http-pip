package main

import (
	"crypto"
	"crypto/hmac"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	httpport = ":4011"
	secret   = `secret`
	alg      = "HS256"
	typ      = "JWT"
)

type tHead struct {
	Typ string `json:"typ"`
	Alg string `json:"alg"`
}

type tPay struct {
	Sub    string `json:"sub"`
	Exp    int32  `json:"exp"`
	Iat    int32  `json:"iat"`
	Errmsg string `json:"errmsg,omitempty"`
}

// EncodeSegment JWT specific base64url encoding with padding stripped
func EncodeSegment(seg []byte) string {
	return strings.TrimRight(base64.URLEncoding.EncodeToString(seg), "=")
}

// DecodeSegment JWT specific base64url encoding with padding stripped
func DecodeSegment(seg string) ([]byte, error) {
	if l := len(seg) % 4; l > 0 {
		seg += strings.Repeat("=", 4-l)
	}
	return base64.URLEncoding.DecodeString(seg)
}

// Encoded Encoded
func Encoded(in *tPay) string {
	headb, _ := json.Marshal(tHead{Alg: alg, Typ: typ})
	head64 := EncodeSegment(headb)
	payb, _ := json.Marshal(tPay{Sub: in.Sub, Iat: int32(time.Now().Unix()), Exp: in.Exp})
	pay64 := EncodeSegment(payb)
	hasher := hmac.New(crypto.SHA256.New, []byte(secret))
	hasher.Write([]byte(head64 + "." + pay64))
	signb := hasher.Sum(nil)
	sign64 := EncodeSegment(signb)
	log.Println(string(headb), string(payb))
	return head64 + "." + pay64 + "." + sign64
}

// Decoded Decoded
func Decoded(in string) *tPay {
	v3 := strings.Split(in, ".")
	if len(v3) != 3 {
		return &tPay{Errmsg: "match"}
	}
	head64 := v3[0]
	headb, _ := DecodeSegment(head64)
	var head tHead
	json.Unmarshal(headb, &head)
	if head.Typ != typ {
		return &tPay{Errmsg: "typ:" + typ}
	}
	if head.Alg != alg {
		return &tPay{Errmsg: "alg:" + alg}
	}
	pay64 := v3[1]
	hasher := hmac.New(crypto.SHA256.New, []byte(secret))
	hasher.Write([]byte(head64 + "." + pay64))
	if v3[2] != EncodeSegment(hasher.Sum(nil)) {
		return &tPay{Errmsg: "sign"}
	}
	payb, _ := DecodeSegment(pay64)
	var pay tPay
	json.Unmarshal(payb, &pay)
	if pay.Exp < int32(time.Now().Unix()) {
		return &tPay{Errmsg: "exp"}
	}
	return &tPay{Sub: pay.Sub, Iat: pay.Iat, Exp: pay.Exp}
}

type server struct{}

func (s *server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	wheader := w.Header()
	wheader.Set("Content-Type", "application/json; charset=utf-8")
	jwt := r.URL.Query().Get("jwt")
	if len(jwt) > 0 {
		var wbys []byte
		if len(jwt) < 32 {
			wbys, _ = json.Marshal(&tPay{Sub: ""})
		} else {
			pay := Decoded(jwt)
			wbys, _ = json.Marshal(&pay)
		}
		w.Write(wbys)
		return
	} else {
		v2 := strings.Split(r.URL.Path[1:], ".")
		in := tPay{Sub: v2[0]}
		d, _ := strconv.Atoi(v2[1])
		in.Exp = int32(time.Now().Unix() + int64(d)*24*3600)
		jwt := Encoded(&in)
		res := fmt.Sprintf(`{"jwt":"%s"}`, jwt)
		w.Write([]byte(res))
		return
	}
}

func main() {
	if len(os.Args) == 1 { // 开启http
		httpser := &http.Server{
			Addr:    httpport,
			Handler: &server{},
		}
		log.Println("listen http://127.0.0.1" + httpport)
		log.Fatal(httpser.ListenAndServe())
	}
	if len(os.Args) == 2 { // 生成token
		v2 := strings.Split(os.Args[1], ".")
		in := tPay{Sub: v2[0]}
		d, _ := strconv.Atoi(v2[1])
		in.Exp = int32(time.Now().Unix() + int64(d)*24*3600)
		res := Encoded(&in)
		fmt.Println("JWT:", res)
	}
}
