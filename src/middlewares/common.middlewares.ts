import { Request, Response} from "express"
import {NextFunction} from 'express-serve-static-core'
import { pick } from "lodash"
type FilterKeys<T> = Array<keyof T>
export const filterMiddlewares = <T>(filterKeys : FilterKeys<T>) => (req : Request, res : Response, next: NextFunction) => {
  req.body = pick(req.body, filterKeys)
  next()
}