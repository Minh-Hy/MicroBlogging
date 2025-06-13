import { accessTokenValidator, verifiedUserValidator } from './../middlewares/users.middlewares';
import { Router } from 'express'
import { searchController } from '~/controller/search.controllers'
import { searchValidator } from '~/middlewares/search.middlewares';


const searchRouter = Router()

searchRouter.get('/',accessTokenValidator,verifiedUserValidator,searchValidator,searchController)

export default searchRouter