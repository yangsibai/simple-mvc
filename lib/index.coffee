###
	Created by massimo on 2014/4/12.
	express-mvc framework
###

fs = require "fs"
express = require "express"
path = require "path"
cons = require "consolidate"

###
	配置路由
	@param options
    @param {String} [options.controllerPath="controller"] controller path
    @pram {String} [options.viewPath="views"] views path
    @param parent app
###
module.exports = (options, parent) ->
	PROJECT_DIR = path.join __dirname, "../../"
	controllerPath = undefined
	viewPath = undefined
	filter = undefined
	if parent is `undefined`
		parent = options
		controllerPath = "controllers"
		viewPath = "views"
		filterPath = path.join PROJECT_DIR, "filter.js"
		if fs.existsSync(filterPath)
			filter = require(filterPath)
		else
			filter = {}
	else
		controllerPath = options.controllerPath
		viewPath = options.viewPath
		filter = options.filter or {}
	fs.readdirSync(path.join(PROJECT_DIR, controllerPath)).forEach (name) ->
		if name.indexOf(".js") isnt -1
			controllerName = name.replace ".js", "" #去掉后缀名
			controller = require path.join PROJECT_DIR, controllerPath, controllerName
			$mvcConfig = controller.$mvcConfig
			app = express()
			engine = "swig"
			engine = $mvcConfig.engine if typeof $mvcConfig isnt "undefined" and $mvcConfig.engine
			if viewPath
				app.engine "html", cons[engine]
				app.set "view engine", "html"
				app.set "views", path.join(PROJECT_DIR, viewPath, controllerName)
			for key of controller
				continue if key[0] is "$" #内部使用的方法以$开头
				methodInfo = getMethodInfo key
				if $mvcConfig and $mvcConfig.route and $mvcConfig.route[methodInfo.action]
					individualConfig = $mvcConfig.route[methodInfo.action]
					httpVerbs = individualConfig.httpVerbs or methodInfo.httpVerbs #配置在mvcConfig中的有更高的优先级，且只取一个，不取并集或交集
					middleware = individualConfig.middleware or methodInfo.middleware #配置在mvcConfig中的中间件有更高的优先级，只取一个位置的
					methodInfo =
						action: methodInfo.action
						httpVerbs: httpVerbs
						middleware: middleware
						path: individualConfig.path
				methodInfo.path = methodInfo.path or "/#{controllerName}/#{methodInfo.action}" unless methodInfo.path

				if methodInfo.middleware
					i = 0

					while i < methodInfo.middleware.length
						itemMiddleware = methodInfo.middleware[i]
						func = controller[itemMiddleware] or filter[itemMiddleware]
						if func and typeof func is "function"
							configRoute app, "all", "/", func  if controllerName is "home"
							configRoute app, "all", "/" + controllerName, func  if methodInfo.action is "index"
							configRoute app, "all", methodInfo.path, func
						else
							console.log "can not find filter", itemMiddleware
						i++
				j = 0

				while j < methodInfo.httpVerbs.length
					itemMethod = methodInfo.httpVerbs[j]
					configRoute app, itemMethod, "/", controller[key] if controllerName is "home"
					configRoute app, itemMethod, "/#{controllerName}", controller[key] if methodInfo.action is "index"
					configRoute app, itemMethod, methodInfo.path, controller[key]
					j++
			parent.use app

###
配置路由
@param app
@param method
@param path
@param func
###
configRoute = (app, method, path, func) ->
	app[method] path, func

###
获取方法支持的HTTP方法和中间件信息
###
getMethodInfo = (methodName) ->
	arr = methodName.split("_")
	httpVerbs = []
	middleware = []
	arr.slice(1).forEach (item) ->
		if item[0] is "$"
			middleware.push item
		else
			httpVerbs.push item.toLowerCase() #http方法转换为小写
		return

	httpVerbs.push "get"  if httpVerbs.length <= 0
	action: arr[0]
	httpVerbs: httpVerbs
	middleware: middleware