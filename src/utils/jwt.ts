import { config } from 'dotenv';
import { SignOptions } from './../../node_modules/@types/jsonwebtoken/index.d';

import jwt from 'jsonwebtoken'
import { TokenPayload } from '~/models/requests/user.requests';
config()

export const signToken = ({
  payload, 
  privateKey, 
  options = {
    algorithm: 'HS256'
  }
} : {
    payload:string | Buffer | object,
    privateKey : string,
    options?: SignOptions 
})=>{
  return new Promise<string>((resolve, rejects)=> {
    jwt.sign(payload, privateKey, options, (error, token) =>{
    if(error) {
      throw rejects(error)
    }
    resolve(token as string)
  })})
}
  
  export const verifyToken = ({token, secretOrPublicKey}: {token: string, secretOrPublicKey: string}) => {
    return new Promise<TokenPayload>((resolve, rejects) => {
      jwt.verify(token, secretOrPublicKey, (error, decoded) => {
        if(error) {
          rejects(error)
        }
        resolve(decoded as TokenPayload)

      })
    })
  }