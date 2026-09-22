import crypto from "node:crypto";

type GoogleState={tenantOrigin:string;nonce:string;exp:number};

function secret(){const v=process.env.DS_OAUTH_STATE_SECRET||process.env.GOOGLE_CLIENT_SECRET;if(!v)throw new Error("Central integration signing is not configured");return v;}
function encode(v:string){return Buffer.from(v).toString("base64url");}
function decode(v:string){return Buffer.from(v,"base64url").toString("utf8");}

export function createGoogleState(tenantOrigin:string){
  const payload:GoogleState={tenantOrigin,nonce:crypto.randomBytes(24).toString("base64url"),exp:Date.now()+10*60*1000};
  const body=encode(JSON.stringify(payload));
  const sig=crypto.createHmac("sha256",secret()).update(body).digest("base64url");
  return {state:`${body}.${sig}`,nonce:payload.nonce};
}
export function verifyGoogleState(state:string){
  const [body,sig]=state.split(".");
  if(!body||!sig)return null;
  const expected=crypto.createHmac("sha256",secret()).update(body).digest("base64url");
  if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;
  try{const value=JSON.parse(decode(body)) as GoogleState;if(!value.tenantOrigin||!value.nonce||value.exp<Date.now())return null;return value;}catch{return null;}
}
